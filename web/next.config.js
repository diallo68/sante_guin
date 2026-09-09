const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  // Le repo a un package-lock.json à sa racine (dépendances de tooling
  // sans rapport avec l'app, ex. Puppeteer) en plus du pnpm-lock.yaml de
  // web/ : Next.js détecte les deux et infère par défaut la racine du
  // repo comme "workspace root" pour le traçage des fichiers du build
  // standalone, au lieu de web/ — voir audit RA-12. Fixé explicitement
  // pour lever l'ambiguïté plutôt que de supprimer le lockfile racine,
  // dont dépend un tooling qui n'a rien à voir avec cette app.
  outputFileTracingRoot: path.join(__dirname),
  // ESLint est maintenant configuré (eslint.config.mjs) et ne remonte plus
  // aucune erreur bloquante sur le code existant (126 avertissements
  // restants, volontairement non bloquants — voir eslint.config.mjs) : le
  // build échoue désormais si une régression est introduite — voir audit
  // section 4 et "ESLint... configurations absentes" section 1.
  eslint: {
    ignoreDuringBuilds: false,
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
  // explicite de CSP, anti-framing, HSTS) — voir audit S21. Le
  // Content-Security-Policy n'est plus fixé ici : il dépend d'un nonce
  // généré à chaque requête (voir audit RA-07) et est donc posé
  // dynamiquement par web/middleware.ts, pas ici où la valeur serait figée
  // au build. Les en-têtes ci-dessous restent statiques par nature.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
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
