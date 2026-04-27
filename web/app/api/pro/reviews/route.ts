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

    const formatted = reviews.map(r => ({
      _id: r._id,
      patientName: `${(r.patientId as any).firstName} ${(r.patientId as any).lastName}`,
      rating: r.rating,
      comment: r.comment,
      date: r.createdAt,
      verified: true,
    }));

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
