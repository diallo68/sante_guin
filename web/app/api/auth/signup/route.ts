import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Doctor from '@/models/Doctor';
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
    const { firstName, lastName, email, phone, password, role = 'patient', specialties, location } = body;

    if (!firstName || !lastName || !password) {
      return NextResponse.json(
        { error: 'Prénom, nom et mot de passe sont requis' },
        { status: 400 }
      );
    }

    if (!email && !phone) {
      return NextResponse.json(
        { error: 'Email ou numéro de téléphone est requis' },
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

    const query: any[] = [];
    if (email) query.push({ email });
    if (phone) query.push({ phone });

    const existing = await User.findOne({ $or: query });
    if (existing) {
      const field = existing.email === email ? 'email' : 'téléphone';
      return NextResponse.json(
        { error: `Ce ${field} est déjà utilisé` },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = await User.create({
      firstName,
      lastName,
      email: email || undefined,
      phone: phone || undefined,
      passwordHash,
      role,
      isVerified: false,
      otpCode: hashOTP(otp),
      otpExpiry,
    });

    // Créer le profil Doctor si le rôle est médecin
    if (role === 'doctor') {
      await Doctor.create({
        userId: user._id,
        firstName,
        lastName,
        specialty: specialties?.[0] || 'Médecin généraliste',
        email: email || undefined,
        phone: phone || undefined,
        city: location || 'Conakry',
      });
    }

    // Envoyer le code OTP par email
    if (email) {
      await sendOTPEmail({ to: email, name: firstName, otp });
    } else {
      // SMS non encore configuré — on affiche le code en console
      console.log(`[SMS skipped] Code OTP pour ${phone} : ${otp}`);
    }

    return NextResponse.json(
      {
        message: 'Code de vérification envoyé',
        userId: user._id.toString(),
        contact: email || phone,
        contactMethod: email ? 'email' : 'phone',
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
