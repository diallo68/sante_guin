import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Doctor from '@/models/Doctor';
import Pharmacy from '@/models/Pharmacy';
import Laboratory from '@/models/Laboratory';
import User from '@/models/User';
import { logError } from '@/lib/logger';

export async function GET() {
  try {
    await connectDB();

    const [doctorCount, pharmacyCount, laboratoryCount, patientCount, ratingAgg] = await Promise.all([
      Doctor.countDocuments(),
      Pharmacy.countDocuments(),
      Laboratory.countDocuments(),
      User.countDocuments({ role: 'patient' }),
      Doctor.aggregate([
        { $match: { rating: { $gt: 0 } } },
        { $group: { _id: null, avg: { $avg: '$rating' } } },
      ]),
    ]);

    const avgRating = ratingAgg[0]?.avg ?? 0;

    return NextResponse.json({
      doctors: doctorCount,
      pharmacies: pharmacyCount,
      laboratories: laboratoryCount,
      patients: patientCount,
      avgRating: Math.round(avgRating * 10) / 10,
    });
  } catch (error) {
    logError('Stats error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
