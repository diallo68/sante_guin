import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { sendOTPEmail } from '@/lib/mailer';

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function hashOTP(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId est requis' }, { status: 400 });
    }

    await connectDB();

    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    }

    if (user.isVerified) {
      return NextResponse.json({ error: 'Compte déjà vérifié' }, { status: 400 });
    }

    const otp = generateOTP();
    user.otpCode = hashOTP(otp);
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    if (user.email) {
      await sendOTPEmail({ to: user.email, name: user.firstName, otp });
    } else {
      console.log(`[SMS skipped] Nouveau code OTP pour ${user.phone} : ${otp}`);
    }

    return NextResponse.json({ message: 'Code renvoyé avec succès' });
  } catch (error: any) {
    console.error('Resend OTP error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
