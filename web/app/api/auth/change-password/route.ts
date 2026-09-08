import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import { getAuthUser, signToken, JWT_COOKIE, isMobileClient } from '@/lib/auth';
import User from '@/models/User';

export async function PUT(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Le nouveau mot de passe doit contenir au moins 8 caractères' }, { status: 400 });
    }

    await connectDB();
    const user = await User.findById(authUser.userId);
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Mot de passe actuel incorrect' }, { status: 400 });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    // Invalide immédiatement tous les tokens déjà émis pour ce compte
    // (protection en cas de mot de passe compromis).
    user.tokenVersion = (user.tokenVersion ?? 0) + 1;
    await user.save();

    // Réémet un token à jour pour la session courante, sinon l'utilisateur
    // se retrouverait déconnecté juste après avoir changé son mot de passe.
    const token = await signToken({
      userId: user._id.toString(),
      email: user.email || '',
      role: user.role,
      tokenVersion: user.tokenVersion,
    });

    // Le web s'appuie sur le cookie httpOnly re-posé ci-dessous ; ne pas lui
    // renvoyer aussi le JWT en clair (audit RA-02, même correction que le
    // login). Mobile (sans cookie) recevrait le token si cette route lui
    // devient un jour accessible.
    const response = NextResponse.json({
      message: 'Mot de passe modifié avec succès',
      ...(isMobileClient(req) ? { token } : {}),
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
    console.error('Change password error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
