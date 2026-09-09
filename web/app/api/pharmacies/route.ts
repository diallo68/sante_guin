import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Pharmacy from '@/models/Pharmacy';
import { escapeRegex, parsePagination } from '@/lib/queryHelpers';
import { logError } from '@/lib/logger';

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
      const pattern = escapeRegex(search);
      query.$or = [
        { name: { $regex: pattern, $options: 'i' } },
        { address: { $regex: pattern, $options: 'i' } },
      ];
    }

    const { page, limit, skip } = parsePagination(searchParams, { defaultLimit: 12, maxLimit: 50 });

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
    logError('Pharmacies list error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
