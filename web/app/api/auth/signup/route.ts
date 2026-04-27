import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import { signToken, JWT_COOKIE } from '@/lib/auth';
import User from '@/models/User';
import Doctor from '@/models/Doctor';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firstName, lastName, email, phone, password, role = 'patient' } = body;

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

    // Vérifier si l'email ou téléphone est déjà utilisé
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

    const user = await User.create({
      firstName,
      lastName,
      email: email || undefined,
      phone: phone || undefined,
      passwordHash,
      role,
    });

    // Créer le profil Doctor si le rôle est médecin
    if (role === 'doctor') {
      await Doctor.create({
        userId: user._id,
        firstName,
        lastName,
        specialty: 'Médecin généraliste',
        email: email || undefined,
        phone: phone || undefined,
        city: 'Conakry',
      });
    }

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
      { status: 201 }
    );

    response.cookies.set(JWT_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 jours
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur, veuillez réessayer' },
      { status: 500 }
    );
  }
}
