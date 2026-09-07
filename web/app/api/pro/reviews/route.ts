import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import Doctor from '@/models/Doctor';
import Review from '@/models/Review';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    await connectDB();

    const doctor = await Doctor.findOne({ userId: authUser.userId })
      .select('rating reviewCount')
      .lean();

    if (!doctor) {
      return NextResponse.json({ error: 'Profil médecin introuvable' }, { status: 404 });
    }

    const reviews = await Review.find({ doctorId: doctor._id })
      .populate('patientId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Un patient supprimé laisse `patientId` non peuplé (null) plutôt que
    // de faire échouer la requête : on tolère cette absence au lieu de
    // déréférencer une valeur potentiellement nulle — voir audit B17.
    const formatted = reviews.map(r => {
      const patient = r.patientId as any;
      return {
        _id: r._id,
        patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Patient supprimé',
        rating: r.rating,
        comment: r.comment,
        date: r.createdAt,
        verified: true,
      };
    });

    return NextResponse.json({
      rating: doctor.rating,
      reviewCount: doctor.reviewCount,
      reviews: formatted,
    });
  } catch (error) {
    console.error('Pro reviews GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
