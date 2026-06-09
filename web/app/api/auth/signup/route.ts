import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Doctor from '@/models/Doctor';
import Pharmacy from '@/models/Pharmacy';
import Laboratory from '@/models/Laboratory';
import { sendOTPEmail } from '@/lib/mailer';

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function hashOTP(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firstName, lastName, email, password, role = 'patient', specialties, location, pharmacyName, laboratoryName } = body;

    if (!firstName || !lastName || !password) {
      return NextResponse.json(
        { error: 'Prénom, nom et mot de passe sont requis' },
        { status: 400 }
      );
    }

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
      passwordHash,
      role,
      isVerified: false,
      otpCode: hashOTP(otp),
      otpExpiry,
    });

    // Créer le profil pro selon le rôle
    if (role === 'doctor') {
      await Doctor.create({
        userId: user._id,
        firstName,
        lastName,
        specialty: specialties?.[0] || 'Médecin généraliste',
        email,
        city: location || 'Conakry',
      });
    } else if (role === 'pharmacist') {
      await Pharmacy.create({
        userId: user._id,
        name: pharmacyName || `Pharmacie ${lastName}`,
        email,
        city: location || 'Conakry',
        address: location || 'Conakry',
      });
    } else if (role === 'laboratorist') {
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
