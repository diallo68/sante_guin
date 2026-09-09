import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { sendOTPEmail } from '@/lib/mailer';
import { generateOTP, hashOTP } from '@/lib/otp';
import { rateLimit, clientIp } from '@/lib/rateLimit';
import { logError } from '@/lib/logger';

// Ce dossier (request / verify / reset) remplace le flux entièrement
// simulé de la page mot de passe oublié : web et mobile enchaînaient des
// délais artificiels sans jamais appeler d'API réelle (le mobile appelait
// même des endpoints qui n'existaient pas), si bien que le mot de passe
// n'était jamais effectivement réinitialisé — voir audit B08.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = body.email || body.contact;
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 });
    }

    const limit = await rateLimit(`forgot-password:${clientIp(req)}:${email.toLowerCase()}`, 5, 15 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json({ error: 'Trop de demandes. Réessayez plus tard.' }, { status: 429 });
    }

    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase() });

    // Réponse identique que le compte existe ou non : révéler l'absence
    // d'un compte permettrait d'énumérer les emails inscrits.
    if (user) {
      const otp = generateOTP();
      user.otpCode = hashOTP(otp);
      user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();
      if (user.email) {
        await sendOTPEmail({ to: user.email, name: user.firstName, otp });
      }
    }

    return NextResponse.json({ message: 'Si un compte existe avec cet email, un code a été envoyé.' });
  } catch (error) {
    logError('Forgot password request error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
