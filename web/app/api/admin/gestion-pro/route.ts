import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import Doctor from '@/models/Doctor';
import Pharmacy from '@/models/Pharmacy';
import Laboratory from '@/models/Laboratory';

export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth || auth.role !== 'admin') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  await connectDB();

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const type = searchParams.get('type') || ''; // 'doctor' | 'pharmacy' | 'laboratory'
  const subStatus = searchParams.get('sub') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 20;

  const filter: Record<string, unknown> = {};
  if (subStatus) filter.subscriptionStatus = subStatus;
  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { name: { $regex: search, $options: 'i' } },
      { specialty: { $regex: search, $options: 'i' } },
    ];
  }

  const results: unknown[] = [];

  if (!type || type === 'doctor') {
    const doctors = await Doctor.find(filter)
      .sort({ createdAt: -1 })
      .limit(type === 'doctor' ? limit : 50)
      .lean();
    doctors.forEach(d => results.push({ ...d, _type: 'doctor' }));
  }

  if (!type || type === 'pharmacy') {
    const phFilter = { ...filter };
    if (search) {
      phFilter.$or = [{ name: { $regex: search, $options: 'i' } }] as any;
    }
    const pharmacies = await Pharmacy.find(phFilter)
      .sort({ createdAt: -1 })
      .limit(type === 'pharmacy' ? limit : 50)
      .lean();
    pharmacies.forEach(p => results.push({ ...p, _type: 'pharmacy' }));
  }

  if (!type || type === 'laboratory') {
    const labFilter = { ...filter };
    if (search) {
      labFilter.$or = [{ name: { $regex: search, $options: 'i' } }] as any;
    }
    const laboratories = await Laboratory.find(labFilter)
      .sort({ createdAt: -1 })
      .limit(type === 'laboratory' ? limit : 50)
      .lean();
    laboratories.forEach(l => results.push({ ...l, _type: 'laboratory' }));
  }

  // Sort combined results by createdAt desc
  results.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const total = results.length;
  const paginated = results.slice((page - 1) * limit, page * limit);

  return NextResponse.json({
    items: paginated,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}
