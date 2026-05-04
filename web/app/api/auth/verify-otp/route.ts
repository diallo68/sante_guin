import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '@/lib/db';
import { signToken, JWT_COOKIE } from '@/lib/auth';
import User from '@/models/User';

function hashOTP(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

export async function POST(req: NextRequest) {
  try {
    const { userId, otp } = await req.json();

    if (!userId || !otp) {
      return NextResponse.json(
        { error: 'userId et code OTP sont requis' },
        { status: 400 }
      );
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
