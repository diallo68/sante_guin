import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import BusinessProfile from '@/models/BusinessProfile';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    await connectDB();
    const profile = await BusinessProfile.findOne({ userId: user.userId });
    return NextResponse.json({ profile: profile || null });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    await connectDB();

    const existing = await BusinessProfile.findOne({ userId: user.userId });
    if (existing) {
      return NextResponse.json({ error: 'Un profil cabinet existe déjà pour ce compte.' }, { status: 400 });
    }

    const body = await req.json();
    const {
      type, name, phone, email, location, address, description,
      specialties, doctorCount, services,
      isOpen24h, hasDelivery,
      openTime, closeTime, openDays,
    } = body;

    if (!type || !name || !phone || !location) {
      return NextResponse.json({ error: 'Champs obligatoires manquants.' }, { status: 400 });
    }

    const profile = await BusinessProfile.create({
      userId: user.userId,
      type, name, phone, email, location, address, description,
      specialties, doctorCount, services,
      isOpen24h, hasDelivery,
      openTime, closeTime, openDays,
    });

    return NextResponse.json({ profile }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    await connectDB();
    const body = await req.json();

    const profile = await BusinessProfile.findOneAndUpdate(
      { userId: user.userId },
      { $set: body },
      { new: true }
    );

    if (!profile) return NextResponse.json({ error: 'Profil introuvable.' }, { status: 404 });
    return NextResponse.json({ profile });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
