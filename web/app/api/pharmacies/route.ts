import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Pharmacy from '@/models/Pharmacy';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const city = searchParams.get('city');
    const open24h = searchParams.get('open24h');
    const search = searchParams.get('search');

    const query: any = {};
    if (city) query.city = city;
    if (open24h === 'true') query.isOpen24h = true;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
      ];
    }

    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '12'));
    const skip = (page - 1) * limit;

    const [pharmacies, total] = await Promise.all([
      Pharmacy.find(query)
        .sort({ rating: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Pharmacy.countDocuments(query),
    ]);

    return NextResponse.json({ pharmacies, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Pharmacies list error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
