import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Doctor from '@/models/Doctor';
import Pharmacy from '@/models/Pharmacy';
import Laboratory from '@/models/Laboratory';
import { sendOTPEmail } from '@/lib/mailer';
import { generateOTP, hashOTP } from '@/lib/otp';
import { rateLimit, clientIp } from '@/lib/rateLimit';

// Seuls ces rôles peuvent être demandés depuis l'inscription publique.
// 'admin' est délibérément exclu : les comptes administrateurs sont créés
// par une procédure distincte et protégée (jamais via ce endpoint public).
const PUBLIC_SIGNUP_ROLES = ['patient', 'doctor', 'pharmacist', 'laboratorist'] as const;
type PublicSignupRole = (typeof PUBLIC_SIGNUP_ROLES)[number];

export async function POST(req: NextRequest) {
  try {
    // Limite les inscriptions en masse (spam, hachage bcrypt coûteux
    // répété) depuis une même IP — voir audit S13.
    const signupLimit = rateLimit(`signup:ip:${clientIp(req)}`, 10, 60 * 60 * 1000);
    if (!signupLimit.allowed) {
      return NextResponse.json({ error: 'Trop de tentatives. Réessayez plus tard.' }, { status: 429 });
    }

    const body = await req.json();
    const { firstName, lastName, email, password, role = 'patient', specialties, location, pharmacyName, laboratoryName, dob, city } = body;

    if (!firstName || !lastName || !password) {
      return NextResponse.json(
        { error: 'Prénom, nom et mot de passe sont requis' },
        { status: 400 }
      );
    }

    // `dob`/`city` restent facultatifs pour ne pas casser le client mobile,
    // qui ne les envoie pas encore — mais si fournis (formulaire web), ils
    // doivent être valides.
    let dobDate: Date | undefined;
    if (dob !== undefined) {
      dobDate = new Date(dob);
      if (Number.isNaN(dobDate.getTime())) {
        return NextResponse.json({ error: 'Date de naissance invalide' }, { status: 400 });
      }
      if (dobDate > new Date()) {
        return NextResponse.json({ error: 'Date de naissance invalide' }, { status: 400 });
      }
    }

    if (typeof role !== 'string' || !PUBLIC_SIGNUP_ROLES.includes(role as PublicSignupRole)) {
      return NextResponse.json(
        { error: 'Rôle invalide' },
        { status: 400 }
      );
    }
    const validatedRole = role as PublicSignupRole;

    if (!email) {
      return NextResponse.json(
        { error: 'L\'email est requis' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 8 caractères' },
        { status: 400 }
      );
    }

    await connectDB();

    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { error: 'Cet email est déjà utilisé' },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = await User.create({
      firstName,
      lastName,
      email,
      dob: dobDate,
      city: typeof city === 'string' && city.trim() ? city.trim() : undefined,
      passwordHash,
      role: validatedRole,
      isVerified: false,
      otpCode: hashOTP(otp),
      otpExpiry,
    });

    // Créer le profil pro selon le rôle
    if (validatedRole === 'doctor') {
      await Doctor.create({
        userId: user._id,
        firstName,
        lastName,
        specialty: specialties?.[0] || 'Médecin généraliste',
        email,
        city: location || 'Conakry',
      });
    } else if (validatedRole === 'pharmacist') {
      await Pharmacy.create({
        userId: user._id,
        name: pharmacyName || `Pharmacie ${lastName}`,
        email,
        city: location || 'Conakry',
        address: location || 'Conakry',
      });
    } else if (validatedRole === 'laboratorist') {
      await Laboratory.create({
        userId: user._id,
        name: laboratoryName || `Laboratoire ${lastName}`,
        email,
        city: location || 'Conakry',
        address: location || 'Conakry',
      });
    }

    await sendOTPEmail({ to: email, name: firstName, otp });

    return NextResponse.json(
      {
        message: 'Code de vérification envoyé',
        userId: user._id.toString(),
        contact: email,
        contactMethod: 'email',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur, veuillez réessayer' },
      { status: 500 }
    );
  }
}
