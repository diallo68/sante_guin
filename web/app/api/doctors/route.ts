import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Doctor from '@/models/Doctor';
import { escapeRegex, parsePagination } from '@/lib/queryHelpers';
import { logError } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const specialty = searchParams.get('specialty');
    const city = searchParams.get('city') || searchParams.get('location');
    const search = searchParams.get('search');
    const available = searchParams.get('available');
    // Filtres avancés correspondant à des champs déjà en base — la page de
    // recherche avancée les envoyait sans que l'API ni la liste ne les
    // exploitent jamais — voir audit B21.
    const minRating = parseFloat(searchParams.get('minRating') || '');
    const maxPrice = parseFloat(searchParams.get('maxPrice') || '');
    const language = searchParams.get('language');

    const query: any = {};
    if (specialty) query.specialty = specialty;
    if (city) query.city = { $regex: escapeRegex(city), $options: 'i' };
    if (available === 'true') query.isAvailable = true;
    if (Number.isFinite(minRating) && minRating > 0) query.rating = { $gte: minRating };
    if (Number.isFinite(maxPrice) && maxPrice > 0) {
      query.consultationFee = { ...(query.consultationFee || {}), $lte: maxPrice };
    }
    if (language) query.languages = { $regex: escapeRegex(language), $options: 'i' };
    if (search) {
      const pattern = escapeRegex(search);
      query.$or = [
        { firstName: { $regex: pattern, $options: 'i' } },
        { lastName: { $regex: pattern, $options: 'i' } },
        { specialty: { $regex: pattern, $options: 'i' } },
      ];
    }

    const { page, limit, skip } = parsePagination(searchParams, { defaultLimit: 12, maxLimit: 50 });

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
    logError('Doctors list error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
