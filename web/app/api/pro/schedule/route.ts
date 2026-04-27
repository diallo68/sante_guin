import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import BusinessProfile from '@/models/BusinessProfile';

const DEFAULT_SCHEDULE = [
  { day: 'Lundi', startTime: '08:00', endTime: '17:00', isOpen: true },
  { day: 'Mardi', startTime: '08:00', endTime: '17:00', isOpen: true },
  { day: 'Mercredi', startTime: '08:00', endTime: '17:00', isOpen: true },
  { day: 'Jeudi', startTime: '08:00', endTime: '17:00', isOpen: true },
  { day: 'Vendredi', startTime: '08:00', endTime: '17:00', isOpen: true },
  { day: 'Samedi', startTime: '09:00', endTime: '13:00', isOpen: true },
  { day: 'Dimanche', startTime: '00:00', endTime: '00:00', isOpen: false },
];

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    await connectDB();
    const profile = await BusinessProfile.findOne({ userId: authUser.userId }).lean();

    if (!profile || !profile.schedule) {
      return NextResponse.json({ schedule: DEFAULT_SCHEDULE });
    }

    return NextResponse.json({ schedule: profile.schedule });
  } catch (error) {
    console.error('Pro schedule GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await req.json();
    const { schedule } = body;

    if (!schedule || !Array.isArray(schedule)) {
      return NextResponse.json({ error: 'Schedule invalide' }, { status: 400 });
    }

    await connectDB();

    const profile = await BusinessProfile.findOneAndUpdate(
      { userId: authUser.userId },
      { schedule },
      { new: true, upsert: false }
    ).lean();

    if (!profile) {
      return NextResponse.json(
        { error: 'Profil business introuvable. Créez d\'abord votre cabinet.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ schedule: profile.schedule });
  } catch (error) {
    console.error('Pro schedule PUT error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
