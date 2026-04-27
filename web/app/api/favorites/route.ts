import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import User from '@/models/User';
import Doctor from '@/models/Doctor';
import Pharmacy from '@/models/Pharmacy';

// GET /api/favorites — returns populated favorites
export async function GET(req: NextRequest) {
  const authUser = await getAuthUser(req);
  if (!authUser) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  await connectDB();

  const user = await User.findById(authUser.userId)
    .select('favorites')
    .lean() as { favorites?: { doctors: string[]; pharmacies: string[] } } | null;

  if (!user) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

  const doctorIds = user.favorites?.doctors ?? [];
  const pharmacyIds = user.favorites?.pharmacies ?? [];

  const [doctors, pharmacies] = await Promise.all([
    Doctor.find({ _id: { $in: doctorIds } })
      .select('firstName lastName specialty city rating reviewCount isAvailable')
      .lean(),
    Pharmacy.find({ _id: { $in: pharmacyIds } })
      .select('name city rating reviewCount isOpen24h openTime closeTime')
      .lean(),
  ]);

  return NextResponse.json({ doctors, pharmacies, doctorIds, pharmacyIds });
}

// POST /api/favorites — toggle a favorite
// body: { type: 'doctor' | 'pharmacy', targetId: string }
export async function POST(req: NextRequest) {
  const authUser = await getAuthUser(req);
  if (!authUser) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { type, targetId } = await req.json();
  if (!type || !targetId || !['doctor', 'pharmacy'].includes(type)) {
    return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 });
  }

  await connectDB();

  const field = type === 'doctor' ? 'favorites.doctors' : 'favorites.pharmacies';

  // Check if already favorited
  const user = await User.findById(authUser.userId).select('favorites').lean() as {
    favorites?: { doctors: string[]; pharmacies: string[] };
  } | null;

  if (!user) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

  const list = (type === 'doctor' ? user.favorites?.doctors : user.favorites?.pharmacies) ?? [];
  const isFav = list.map(String).includes(String(targetId));

  await User.findByIdAndUpdate(
    authUser.userId,
    isFav
      ? { $pull: { [field]: targetId } }
      : { $addToSet: { [field]: targetId } }
  );

  return NextResponse.json({ favorited: !isFav });
}
