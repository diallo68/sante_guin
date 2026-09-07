import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { OAUTH_STATE_COOKIE } from '@/lib/oauthState';

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: 'Google OAuth non configuré' }, { status: 501 });
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`;
  const scope = 'openid email profile';

  // `state` lié au navigateur (cookie httpOnly) et revérifié au retour du
  // callback : sans ça, un attaquant pouvait faire ouvrir à une victime un
  // lien de callback initié pour un autre compte (CSRF de connexion) —
  // voir audit S15.
  const state = crypto.randomBytes(32).toString('hex');

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', scope);
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'select_account');
  url.searchParams.set('state', state);

  const response = NextResponse.redirect(url.toString());
  response.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 10 * 60,
    path: '/',
  });
  return response;
}
