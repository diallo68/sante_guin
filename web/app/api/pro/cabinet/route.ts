import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import BusinessProfile from '@/models/BusinessProfile';
import { PRO_ROLES, ProRole } from '@/lib/proAccess';
import { logError } from '@/lib/logger';

// Champs qu'un professionnel peut renseigner lui-même. `userId`, `isVerified`,
// `rating`, `reviewCount` et `isActive` sont volontairement exclus : ce sont
// des champs de confiance qui ne doivent être modifiés que par une procédure
// administrative — voir audit S11.
const EDITABLE_FIELDS = [
  'type', 'name', 'phone', 'email', 'location', 'address', 'description',
  'specialties', 'doctorCount', 'services', 'analyses',
  'isOpen24h', 'hasDelivery',
  'openTime', 'closeTime', 'openDays',
] as const;

function pickEditableFields(body: Record<string, unknown>) {
  const result: Record<string, unknown> = {};
  for (const key of EDITABLE_FIELDS) {
    if (key in body) result[key] = body[key];
  }
  return result;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user || !PRO_ROLES.includes(user.role as ProRole)) {
      return NextResponse.json({ error: 'Accès réservé aux professionnels de santé' }, { status: 403 });
    }

    await connectDB();
    const profile = await BusinessProfile.findOne({ userId: user.userId });
    return NextResponse.json({ profile: profile || null });
  } catch (error) {
    logError('Cabinet GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user || !PRO_ROLES.includes(user.role as ProRole)) {
      return NextResponse.json({ error: 'Accès réservé aux professionnels de santé' }, { status: 403 });
    }

    await connectDB();

    const existing = await BusinessProfile.findOne({ userId: user.userId });
    if (existing) {
      return NextResponse.json({ error: 'Un profil cabinet existe déjà pour ce compte.' }, { status: 400 });
    }

    const body = await req.json();
    const fields = pickEditableFields(body);
    const { type, name, phone, location } = fields as Record<string, string | undefined>;

    if (!type || !name || !phone || !location) {
      return NextResponse.json({ error: 'Champs obligatoires manquants.' }, { status: 400 });
    }

    const profile = await BusinessProfile.create({
      userId: user.userId,
      ...fields,
    });

    return NextResponse.json({ profile }, { status: 201 });
  } catch (error) {
    logError('Cabinet POST error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user || !PRO_ROLES.includes(user.role as ProRole)) {
      return NextResponse.json({ error: 'Accès réservé aux professionnels de santé' }, { status: 403 });
    }

    await connectDB();
    const body = await req.json();
    const fields = pickEditableFields(body);

    const profile = await BusinessProfile.findOneAndUpdate(
      { userId: user.userId },
      { $set: fields },
      { new: true, runValidators: true }
    );

    if (!profile) return NextResponse.json({ error: 'Profil introuvable.' }, { status: 404 });
    return NextResponse.json({ profile });
  } catch (error) {
    logError('Cabinet PUT error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
