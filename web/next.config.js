/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Les 5 erreurs TypeScript préexistantes (dont B10) sont corrigées ;
  // le build échoue désormais si une régression de typage est introduite,
  // au lieu de la laisser passer silencieusement — voir audit section 4.
  typescript: {
    ignoreBuildErrors: false,
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['mondocteur.org', 'www.mondocteur.org'],
    },
  },
  // Force all pages to be dynamic (SSR) — required for auth/cookies
  output: 'standalone',

  // Protections navigateur absentes jusqu'ici (aucune configuration
  // explicite de CSP, anti-framing, HSTS) — voir audit S21. Le CSP autorise
  // 'unsafe-inline' pour les scripts : c'est le compromis pragmatique pour
  // les scripts d'hydratation inline de l'App Router sans passer par un
  // système de nonce (changement plus large, à part). Il bloque déjà
  // l'exécution de scripts injectés depuis un domaine externe, qui est le
  // vecteur principal d'une XSS stockée exploitée à distance.
  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join('; ');

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
