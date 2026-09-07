import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { signToken, JWT_COOKIE } from '@/lib/auth';
import { OAUTH_STATE_COOKIE } from '@/lib/oauthState';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${appUrl}/auth/login?error=oauth_misconfigured`);
  }

  const code = req.nextUrl.searchParams.get('code');
  if (!code) {
    return NextResponse.redirect(`${appUrl}/auth/login?error=oauth_cancelled`);
  }

  // Le `state` renvoyé par Google doit correspondre à celui émis dans le
  // cookie httpOnly au départ du flux : sans ce contrôle, un attaquant
  // pouvait faire ouvrir à une victime un lien de callback initié pour un
  // autre compte (CSRF de connexion) — voir audit S15.
  const returnedState = req.nextUrl.searchParams.get('state');
  const expectedState = req.cookies.get(OAUTH_STATE_COOKIE)?.value;
  const stateValid = !!returnedState && !!expectedState && returnedState === expectedState;

  if (!stateValid) {
    const response = NextResponse.redirect(`${appUrl}/auth/login?error=oauth_invalid_state`);
    response.cookies.delete(OAUTH_STATE_COOKIE);
    return response;
  }

  try {
    const redirectUri = `${appUrl}/api/auth/google/callback`;

    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      return NextResponse.redirect(`${appUrl}/auth/login?error=oauth_token_failed`);
    }

    const { access_token } = await tokenRes.json();

    // Fetch Google user profile
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!profileRes.ok) {
      return NextResponse.redirect(`${appUrl}/auth/login?error=oauth_profile_failed`);
    }

    const profile = await profileRes.json() as {
      id: string;
      email: string;
      given_name: string;
      family_name: string;
    };

    if (!profile.email) {
      return NextResponse.redirect(`${appUrl}/auth/login?error=oauth_no_email`);
    }

    await connectDB();

    // Find or create user
    let user = await User.findOne({ email: profile.email.toLowerCase() });

    if (!user) {
      // Create a new patient account (random password hash — OAuth users can't login with password)
      const passwordHash = await bcrypt.hash(`google_oauth_${profile.id}_${Date.now()}`, 10);
      user = await User.create({
        firstName: profile.given_name || 'Utilisateur',
        lastName: profile.family_name || '',
        email: profile.email.toLowerCase(),
        passwordHash,
        role: 'patient',
        isVerified: true,
      });
    } else if (user.isSuspended) {
      return NextResponse.redirect(`${appUrl}/auth/login?error=account_suspended`);
    }

    // Issue JWT
    const token = await signToken({
      userId: user._id.toString(),
      email: user.email || '',
      role: user.role,
      tokenVersion: user.tokenVersion ?? 0,
    });

    const response = NextResponse.redirect(
      user.role === 'doctor' || user.role === 'pharmacist'
        ? `${appUrl}/pro/dashboard`
        : `${appUrl}/`
    );

    response.cookies.set(JWT_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    response.cookies.delete(OAUTH_STATE_COOKIE);

    return response;
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    return NextResponse.redirect(`${appUrl}/auth/login?error=oauth_server_error`);
  }
}
