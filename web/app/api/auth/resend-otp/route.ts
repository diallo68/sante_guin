import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { sendOTPEmail } from '@/lib/mailer';
import { generateOTP, hashOTP } from '@/lib/otp';
import { rateLimit } from '@/lib/rateLimit';
import { logError } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId est requis' }, { status: 400 });
    }

    // Limite le renvoi d'emails (spam) et empêche de réinitialiser sans
    // fin la fenêtre de tentatives de /verify-otp — voir audit S13.
    const resendLimit = rateLimit(`resend-otp:${userId}`, 3, 10 * 60 * 1000);
    if (!resendLimit.allowed) {
      return NextResponse.json({ error: 'Trop de demandes. Réessayez plus tard.' }, { status: 429 });
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
    }

    return NextResponse.json({ message: 'Code renvoyé avec succès' });
  } catch (error: any) {
    logError('Resend OTP error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
