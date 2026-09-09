import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import Doctor from '@/models/Doctor';
import { logError } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    await connectDB();
    const doctor = await Doctor.findOne({ userId: authUser.userId }).lean();

    if (!doctor) {
      return NextResponse.json({ error: 'Profil médecin introuvable' }, { status: 404 });
    }

    return NextResponse.json({ doctor });
  } catch (error) {
    logError('Pro profile GET error:', error);
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
    const { firstName, lastName, specialty, phone, email, city, address, bio, consultationFee, languages } = body;

    await connectDB();

    const doctor = await Doctor.findOneAndUpdate(
      { userId: authUser.userId },
      {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(specialty && { specialty }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(city && { city }),
        ...(address !== undefined && { address }),
        ...(bio !== undefined && { bio }),
        ...(consultationFee !== undefined && { consultationFee }),
        ...(languages && { languages }),
      },
      { new: true }
    ).lean();

    if (!doctor) {
      return NextResponse.json({ error: 'Profil médecin introuvable' }, { status: 404 });
    }

    return NextResponse.json({ doctor });
  } catch (error) {
    logError('Pro profile PUT error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
