import { NextRequest, NextResponse } from 'next/server';
import { verifyTokenEdge } from '@/lib/jwtEdge';

const JWT_COOKIE = 'gs_token';
const PROTECTED_ROUTES = ['/pro', '/profile'];
const PRO_ONLY_ROUTES = ['/pro'];

// Comparaison par segment de chemin, pas par préfixe brut : sans ça,
// `/profile`.startsWith('/pro') vaut `true` et un patient ouvrant son
// propre profil se faisait rediriger vers l'accueil — voir audit B02.
function matchesRoute(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(`${route}/`);
}

// CSP par nonce généré à chaque requête plutôt que 'unsafe-inline' sur
// script-src — voir audit RA-07. `strict-dynamic` autorise les scripts que
// Next.js injecte lui-même (hydratation, RSC) dès qu'ils descendent d'un
// script portant le nonce, sans avoir à lister leurs URLs. style-src garde
// 'unsafe-inline' : React compile `style={{...}}` en attribut `style`
// inline sur l'élément, que ni nonce ni hash ne peuvent couvrir côté
// React ; le risque réel d'une CSP visait surtout l'exécution de script.
function buildCsp(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; ');
}

// `new URL(path, req.url)` construit une URL absolue à partir de l'origine
// que Next.js pense avoir — en mode `output: standalone` derrière le proxy
// Nginx de la VM (127.0.0.1:3020), cette origine reste bloquée sur
// `https://localhost:3020` MÊME quand Nginx transmet correctement l'en-tête
// Host (vérifié par des requêtes directes au port 3020, Host forcé inclus).
// Résultat : toute redirection vers /auth/login depuis une page protégée
// (donc tout accès non connecté à /pro/* ou /profile, dont Ham) renvoyait
// vers une URL localhost inatteignable depuis l'extérieur — capture d'écran
// Safari "Safari ne parvient pas à se connecter au serveur « localhost »"
// du 2026-09-12. On reconstruit l'origine nous-mêmes depuis les en-têtes
// que Nginx transmet réellement (Host, X-Forwarded-Proto) plutôt que de
// faire confiance à req.url pour ça.
function publicOrigin(req: NextRequest): string {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || req.nextUrl.host;
  const proto = req.headers.get('x-forwarded-proto') || req.nextUrl.protocol.replace(':', '');
  return `${proto}://${host}`;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const origin = publicOrigin(req);

  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-nonce', nonce);

  const isProtected = PROTECTED_ROUTES.some(r => matchesRoute(pathname, r));
  if (isProtected) {
    const token = req.cookies.get(JWT_COOKIE)?.value;

    if (!token) {
      const loginUrl = new URL('/auth/login', origin);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Vérification cryptographique de la signature (voir audit RA-08) : un
    // JWT décodé sans vérification pouvait laisser passer la coquille d'une
    // page protégée avant que l'API ne le refuse. La revalidation en base
    // (suspension, tokenVersion) reste faite par chaque route API — le
    // middleware ne fait que décider s'il affiche la page ou redirige.
    const payload = await verifyTokenEdge(token);

    if (!payload) {
      const loginUrl = new URL('/auth/login', origin);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // /pro est réservé aux médecins, pharmaciens et admins
    const isProRoute = PRO_ONLY_ROUTES.some(r => matchesRoute(pathname, r));
    if (isProRoute && payload.role === 'patient') {
      return NextResponse.redirect(new URL('/', origin));
    }
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', buildCsp(nonce));
  return response;
}

export const config = {
  // Tourne sur toutes les pages (pour poser le nonce CSP), mais pas sur les
  // routes API ni les assets statiques internes — inutile et coûteux là.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
