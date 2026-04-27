import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Doctor from '@/models/Doctor';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const specialty = searchParams.get('specialty');
    const city = searchParams.get('city');
    const search = searchParams.get('search');
    const available = searchParams.get('available');

    const query: any = {};
    if (specialty) query.specialty = specialty;
    if (city) query.city = city;
    if (available === 'true') query.isAvailable = true;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { specialty: { $regex: search, $options: 'i' } },
      ];
    }

    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '12'));
    const skip = (page - 1) * limit;

    const [doctors, total] = await Promise.all([
      Doctor.find(query)
        .sort({ rating: -1, reviewCount: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Doctor.countDocuments(query),
    ]);

    return NextResponse.json({ doctors, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Doctors list error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
