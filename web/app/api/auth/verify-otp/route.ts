import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { signToken, JWT_COOKIE } from '@/lib/auth';
import User from '@/models/User';
import { hashOTP } from '@/lib/otp';
import { rateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const { userId, otp } = await req.json();

    if (!userId || !otp) {
      return NextResponse.json(
        { error: 'userId et code OTP sont requis' },
        { status: 400 }
      );
    }

    // Un code à 6 chiffres n'a que 900 000 valeurs possibles : sans limite
    // de tentatives, il est raisonnablement devinable par force brute
    // pendant sa durée de vie de 10 minutes — voir audit S13.
    const otpLimit = rateLimit(`verify-otp:${userId}`, 10, 10 * 60 * 1000);
    if (!otpLimit.allowed) {
      return NextResponse.json({ error: 'Trop de tentatives. Demandez un nouveau code.' }, { status: 429 });
    }

    await connectDB();

    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    }

    if (user.isVerified) {
      return NextResponse.json({ error: 'Compte déjà vérifié' }, { status: 400 });
    }

    if (!user.otpCode || !user.otpExpiry) {
      return NextResponse.json({ error: 'Aucun code en attente' }, { status: 400 });
    }

    if (new Date() > user.otpExpiry) {
      return NextResponse.json(
        { error: 'Code expiré. Veuillez en demander un nouveau.' },
        { status: 400 }
      );
    }

    if (hashOTP(otp) !== user.otpCode) {
      return NextResponse.json({ error: 'Code incorrect' }, { status: 400 });
    }

    // Valider le compte
    user.isVerified = true;
    user.otpCode = undefined;
    user.otpExpiry = undefined;
    await user.save();

    const token = await signToken({
      userId: user._id.toString(),
      email: user.email || '',
      role: user.role,
      tokenVersion: user.tokenVersion ?? 0,
    });

    const response = NextResponse.json(
      {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      },
      { status: 200 }
    );

    response.cookies.set(JWT_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
