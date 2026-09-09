import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import { signToken, JWT_COOKIE, isMobileClient } from '@/lib/auth';
import User from '@/models/User';
import { rateLimit, clientIp } from '@/lib/rateLimit';
import { logError } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const contact = body.contact || body.email;
    const { password } = body;

    if (!contact || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe sont requis' },
        { status: 400 }
      );
    }

    // Limite les tentatives par IP (bourrage d'identifiants sur des comptes
    // variés) et par couple IP+email (attaque ciblée sur un seul compte) —
    // voir audit S13.
    const ip = clientIp(req);
    const perIp = rateLimit(`login:ip:${ip}`, 30, 15 * 60 * 1000);
    const perAccount = rateLimit(`login:acct:${ip}:${contact.toLowerCase()}`, 10, 15 * 60 * 1000);
    if (!perIp.allowed || !perAccount.allowed) {
      return NextResponse.json(
        { error: 'Trop de tentatives. Réessayez plus tard.' },
        { status: 429 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: contact.toLowerCase() });

    if (!user) {
      return NextResponse.json(
        { error: 'Identifiants incorrects' },
        { status: 401 }
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Identifiants incorrects' },
        { status: 401 }
      );
    }

    if (user.isSuspended) {
      return NextResponse.json(
        { error: 'Ce compte a été suspendu. Contactez le support.' },
        { status: 403 }
      );
    }

    if (!user.isVerified) {
      return NextResponse.json(
        {
          error: 'Compte non vérifié. Veuillez confirmer votre email.',
          userId: user._id.toString(),
          requiresVerification: true,
        },
        { status: 403 }
      );
    }

    const token = await signToken({
      userId: user._id.toString(),
      email: user.email || '',
      role: user.role,
      tokenVersion: user.tokenVersion ?? 0,
    });

    // Le web s'appuie uniquement sur le cookie httpOnly posé ci-dessous ; lui
    // renvoyer aussi le JWT en clair exposerait un bearer réutilisable à
    // toute XSS (audit RA-02). Seul mobile (sans stockage de cookie) reçoit
    // le token dans le corps JSON, identifié par son header dédié.
    const response = NextResponse.json({
      ...(isMobileClient(req) ? { token } : {}),
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set(JWT_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    logError('Login error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur, veuillez réessayer' },
      { status: 500 }
    );
  }
}
