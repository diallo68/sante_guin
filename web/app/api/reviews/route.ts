import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import Review from '@/models/Review';
import Doctor from '@/models/Doctor';
import { logError } from '@/lib/logger';

// Web et mobile affichent tous deux `patientName`/`date`, mais l'API
// renvoyait `patientId` (peuplé) et `createdAt` — les deux champs
// affichés restaient donc vides côté client — voir audit B15. Un DTO
// commun, utilisé à la fois en lecture et à la création, évite que les
// deux dérivent à nouveau.
function toReviewDTO(review: any) {
  const patient = review.patientId;
  return {
    _id: review._id,
    doctorId: review.doctorId,
    patientName: patient && typeof patient === 'object'
      ? `${patient.firstName} ${patient.lastName}`
      : 'Patient',
    rating: review.rating,
    comment: review.comment,
    date: review.createdAt,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get('doctorId');
    if (!doctorId) {
      return NextResponse.json({ error: 'doctorId requis' }, { status: 400 });
    }

    await connectDB();
    const reviews = await Review.find({ doctorId })
      .populate('patientId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return NextResponse.json({ reviews: reviews.map(toReviewDTO) });
  } catch (error) {
    logError('Reviews GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await req.json();
    const { doctorId, rating, comment } = body;

    if (!doctorId || !rating) {
      return NextResponse.json({ error: 'Médecin et note requis' }, { status: 400 });
    }
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Note entre 1 et 5' }, { status: 400 });
    }

    await connectDB();

    // Vérifier si l'avis existe déjà
    const existing = await Review.findOne({ doctorId, patientId: authUser.userId });
    if (existing) {
      return NextResponse.json({ error: 'Vous avez déjà laissé un avis pour ce médecin' }, { status: 409 });
    }

    const review = await Review.create({
      doctorId,
      patientId: authUser.userId,
      rating,
      comment: comment?.trim() || '',
    });

    // Recalculer la note moyenne du médecin
    const agg = await Review.aggregate([
      { $match: { doctorId: review.doctorId } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    if (agg[0]) {
      await Doctor.findByIdAndUpdate(doctorId, {
        rating: Math.round(agg[0].avg * 10) / 10,
        reviewCount: agg[0].count,
      });
    }

    await review.populate('patientId', 'firstName lastName');
    return NextResponse.json({ review: toReviewDTO(review.toObject()) }, { status: 201 });
  } catch (error) {
    logError('Reviews POST error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
