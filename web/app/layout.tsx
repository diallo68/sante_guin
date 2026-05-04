import type { Metadata, Viewport } from 'next';
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
