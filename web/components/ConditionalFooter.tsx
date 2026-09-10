'use client';

import { usePathname } from 'next/navigation';
import Footer from './Footer';

// L'admin et l'espace Pro ont leur propre chrome (sidebar) : le footer
// marketing n'y a pas sa place, donc on le masque sur ces sections.
export default function ConditionalFooter() {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/pro')) return null;
  return <Footer />;
}
