import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import Doctor from '@/models/Doctor';
import { escapeRegex } from '@/lib/queryHelpers';

export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth || auth.role !== 'admin') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  await connectDB();

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const verified = searchParams.get('verified');
  const parsedPage = parseInt(searchParams.get('page') || '1', 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const limit = 20;

  const filter: Record<string, unknown> = {};
  if (verified === 'true') filter.isVerified = true;
  if (verified === 'false') filter.isVerified = false;
  if (search) {
    const pattern = escapeRegex(search);
    filter.$or = [
      { firstName: { $regex: pattern, $options: 'i' } },
      { lastName: { $regex: pattern, $options: 'i' } },
      { specialty: { $regex: pattern, $options: 'i' } },
    ];
  }

  const [doctors, total] = await Promise.all([
    Doctor.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Doctor.countDocuments(filter),
  ]);

  return NextResponse.json({ doctors, total, page, pages: Math.ceil(total / limit) });
}
