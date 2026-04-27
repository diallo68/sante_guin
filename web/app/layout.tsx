import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Guinée Santé - Gestion des Rendez-vous Médicaux',
  description: 'Application pour la gestion des rendez-vous médicaux et pharmacies en Guinée',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-white text-gray-900">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
