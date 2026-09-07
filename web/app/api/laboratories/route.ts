import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Laboratory from '@/models/Laboratory';
import { escapeRegex, parsePagination } from '@/lib/queryHelpers';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const city = searchParams.get('city');
    const open24h = searchParams.get('open24h');
    const search = searchParams.get('search');
    const analysis = searchParams.get('analysis');

    const query: any = {};
    if (city) query.city = city;
    if (open24h === 'true') query.isOpen24h = true;
    if (analysis) query.analyses = { $regex: escapeRegex(analysis), $options: 'i' };
    if (search) {
      const pattern = escapeRegex(search);
      query.$or = [
        { name: { $regex: pattern, $options: 'i' } },
        { address: { $regex: pattern, $options: 'i' } },
        { analyses: { $regex: pattern, $options: 'i' } },
      ];
    }

    const { page, limit, skip } = parsePagination(searchParams, { defaultLimit: 12, maxLimit: 50 });

    const [laboratories, total] = await Promise.all([
      Laboratory.find(query)
        .sort({ rating: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Laboratory.countDocuments(query),
    ]);

    return NextResponse.json({ laboratories, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Laboratories list error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
