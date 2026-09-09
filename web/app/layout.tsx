import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import './globals.css';
import Navbar from '@/components/Navbar';
import PWAProvider from '@/components/PWAProvider';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Mondocteur - Gestion des Rendez-vous Médicaux',
  description: 'Application pour la gestion des rendez-vous médicaux et pharmacies en Guinée',
  icons: { icon: '/logo.png', apple: '/logo.png' },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Mondocteur',
  },
};

export const viewport: Viewport = {
  themeColor: '#0d9488',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Lire le nonce posé par web/middleware.ts fait que Next.js l'applique
  // lui-même aux scripts inline qu'il injecte (hydratation, RSC) — c'est
  // ce qui permet de retirer 'unsafe-inline' de script-src (audit RA-07),
  // sans avoir à passer le nonce explicitement à chaque script.
  await headers();

  return (
    <html lang="fr">
      <body className="bg-white text-gray-900">
        <Navbar />
        {children}
        <PWAProvider />
      </body>
    </html>
  );
}
