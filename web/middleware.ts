import { NextRequest, NextResponse } from 'next/server';

const JWT_COOKIE = 'gs_token';
const PROTECTED_ROUTES = ['/pro', '/profile'];
const PRO_ONLY_ROUTES = ['/pro'];

// Décodage simple du payload JWT (sans vérification cryptographique)
// La vérification complète est faite dans les API routes avec jose
function decodeJWTPayload(token: string): { role?: string } | null {
  try {
    const [, payload] = token.split('.');
    const decoded = JSON.parse(
      Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8')
    );
    return decoded;
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED_ROUTES.some(r => pathname.startsWith(r));
  if (!isProtected) return NextResponse.next();

  const token = req.cookies.get(JWT_COOKIE)?.value;

  if (!token) {
    const loginUrl = new URL('/auth/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const payload = decodeJWTPayload(token);

  if (!payload) {
    const loginUrl = new URL('/auth/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // /pro est réservé aux médecins, pharmaciens et admins
  const isProRoute = PRO_ONLY_ROUTES.some(r => pathname.startsWith(r));
  if (isProRoute && payload.role === 'patient') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/pro/:path*', '/profile/:path*'],
};
