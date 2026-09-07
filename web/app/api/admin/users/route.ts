import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import User from '@/models/User';
import { escapeRegex } from '@/lib/queryHelpers';

export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth || auth.role !== 'admin') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  await connectDB();

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const role = searchParams.get('role') || '';
  const parsedPage = parseInt(searchParams.get('page') || '1', 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const limit = 20;

  const filter: Record<string, unknown> = {};
  if (role) filter.role = role;
  if (search) {
    const pattern = escapeRegex(search);
    filter.$or = [
      { firstName: { $regex: pattern, $options: 'i' } },
      { lastName: { $regex: pattern, $options: 'i' } },
      { email: { $regex: pattern, $options: 'i' } },
      { phone: { $regex: pattern, $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  return NextResponse.json({ users, total, page, pages: Math.ceil(total / limit) });
}
