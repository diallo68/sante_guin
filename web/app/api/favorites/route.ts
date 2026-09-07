import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import User from '@/models/User';
import Doctor from '@/models/Doctor';
import Pharmacy from '@/models/Pharmacy';
import Laboratory from '@/models/Laboratory';

interface FavoritesShape {
  doctors: string[];
  pharmacies: string[];
  laboratories: string[];
}

// GET /api/favorites — returns populated favorites
export async function GET(req: NextRequest) {
  const authUser = await getAuthUser(req);
  if (!authUser) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  await connectDB();

  const user = await User.findById(authUser.userId)
    .select('favorites')
    .lean() as { favorites?: FavoritesShape } | null;

  if (!user) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

  const doctorIds = user.favorites?.doctors ?? [];
  const pharmacyIds = user.favorites?.pharmacies ?? [];
  // Le schéma User a toujours eu un champ `favorites.laboratories`, mais
  // cette route ne le prenait jamais en charge — voir audit B14.
  const laboratoryIds = user.favorites?.laboratories ?? [];

  const [doctors, pharmacies, laboratories] = await Promise.all([
    Doctor.find({ _id: { $in: doctorIds } })
      .select('firstName lastName specialty city rating reviewCount isAvailable')
      .lean(),
    Pharmacy.find({ _id: { $in: pharmacyIds } })
      .select('name city rating reviewCount isOpen24h openTime closeTime')
      .lean(),
    Laboratory.find({ _id: { $in: laboratoryIds } })
      .select('name city rating reviewCount isOpen24h openTime closeTime')
      .lean(),
  ]);

  return NextResponse.json({ doctors, pharmacies, laboratories, doctorIds, pharmacyIds, laboratoryIds });
}

// POST /api/favorites — toggle a favorite
// body: { type: 'doctor' | 'pharmacy' | 'laboratory', targetId: string }
export async function POST(req: NextRequest) {
  const authUser = await getAuthUser(req);
  if (!authUser) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { type, targetId } = await req.json();
  if (!type || !targetId || !['doctor', 'pharmacy', 'laboratory'].includes(type)) {
    return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 });
  }

  await connectDB();

  const field = type === 'doctor' ? 'favorites.doctors' : type === 'pharmacy' ? 'favorites.pharmacies' : 'favorites.laboratories';

  // Check if already favorited
  const user = await User.findById(authUser.userId).select('favorites').lean() as {
    favorites?: FavoritesShape;
  } | null;

  if (!user) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

  const list = (
    type === 'doctor' ? user.favorites?.doctors
      : type === 'pharmacy' ? user.favorites?.pharmacies
        : user.favorites?.laboratories
  ) ?? [];
  const isFav = list.map(String).includes(String(targetId));

  await User.findByIdAndUpdate(
    authUser.userId,
    isFav
      ? { $pull: { [field]: targetId } }
      : { $addToSet: { [field]: targetId } }
  );

  return NextResponse.json({ favorited: !isFav });
}
