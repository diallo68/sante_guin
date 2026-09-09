import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { hashOTP } from '@/lib/otp';
import { rateLimit } from '@/lib/rateLimit';
import { logError } from '@/lib/logger';

// Vérifie le code sans le consommer, pour donner un retour immédiat avant
// l'étape de saisie du nouveau mot de passe. La vérification réelle et
// définitive a lieu dans /api/auth/forgot-password/reset — voir audit B08.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = body.email || body.contact;
    const { otp } = body;
    if (!email || !otp) {
      return NextResponse.json({ error: 'Email et code requis' }, { status: 400 });
    }

    const limit = rateLimit(`verify-reset-otp:${email.toLowerCase()}`, 10, 10 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json({ error: 'Trop de tentatives. Demandez un nouveau code.' }, { status: 429 });
    }

    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase() }).select('otpCode otpExpiry');

    if (!user || !user.otpCode || !user.otpExpiry || new Date() > user.otpExpiry) {
      return NextResponse.json({ error: 'Code invalide ou expiré' }, { status: 400 });
    }
    if (hashOTP(otp) !== user.otpCode) {
      return NextResponse.json({ error: 'Code incorrect' }, { status: 400 });
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    logError('Verify reset OTP error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
