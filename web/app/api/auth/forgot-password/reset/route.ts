import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { hashOTP } from '@/lib/otp';
import { rateLimit } from '@/lib/rateLimit';
import { logError } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = body.email || body.contact;
    const { otp, newPassword } = body;
    if (!email || !otp || !newPassword) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
    }
    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 8 caractères' }, { status: 400 });
    }

    const limit = rateLimit(`reset-password:${email.toLowerCase()}`, 10, 10 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json({ error: 'Trop de tentatives. Demandez un nouveau code.' }, { status: 429 });
    }

    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user || !user.otpCode || !user.otpExpiry || new Date() > user.otpExpiry) {
      return NextResponse.json({ error: 'Code invalide ou expiré' }, { status: 400 });
    }
    if (hashOTP(otp) !== user.otpCode) {
      return NextResponse.json({ error: 'Code incorrect' }, { status: 400 });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.otpCode = undefined;
    user.otpExpiry = undefined;
    // Invalide toute session déjà ouverte avec l'ancien mot de passe (par
    // exemple sur un autre appareil) — voir audit S04/B08.
    user.tokenVersion = (user.tokenVersion ?? 0) + 1;
    await user.save();

    return NextResponse.json({ message: 'Mot de passe réinitialisé avec succès' });
  } catch (error) {
    logError('Reset password error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
