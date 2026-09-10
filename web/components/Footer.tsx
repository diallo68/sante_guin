import Link from 'next/link';
import Image from 'next/image';

const columns: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Patients',
    links: [
      { label: 'Trouver un médecin', href: '/doctors' },
      { label: 'Trouver une pharmacie', href: '/pharmacies' },
      { label: 'Mon compte', href: '/profile' },
      { label: 'Mes rendez-vous', href: '/profile' },
    ],
  },
  {
    title: 'Professionnels',
    links: [
      { label: 'Espace Pro', href: '/pro-avantages' },
      { label: 'Se connecter', href: '/auth/login' },
    ],
  },
  {
    title: 'Aide',
    links: [
      { label: 'Contact', href: 'mailto:support@guineesante.gn' },
      { label: 'WhatsApp', href: 'https://wa.me/224620000000' },
      { label: 'Conditions', href: '/terms' },
      { label: 'Confidentialité', href: '/privacy' },
    ],
  },
];

const socials = [
  { label: 'LinkedIn', href: 'https://linkedin.com', letter: 'in' },
  { label: 'Facebook', href: 'https://facebook.com', letter: 'f' },
  { label: 'Instagram', href: 'https://instagram.com', letter: '◎' },
  { label: 'YouTube', href: 'https://youtube.com', letter: '▶' },
];

export default function Footer() {
  return (
    <footer className="bg-mist-50 border-t border-ink-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 mb-10">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Image src="/logo.png" alt="Mondocteur" width={32} height={32} className="object-contain" />
              <span className="text-lg font-bold text-ink-900">Mondocteur</span>
            </Link>
            <p className="text-ink-400 text-sm leading-relaxed max-w-xs">
              Une santé plus proche de vous. La plateforme qui connecte patients et professionnels de santé en Guinée.
            </p>
          </div>
          {columns.map(col => (
            <div key={col.title}>
              <h4 className="font-bold text-ink-900 mb-4 text-sm uppercase tracking-wider">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map(item => (
                  <li key={item.label}>
                    <Link href={item.href as any} className="text-ink-400 hover:text-primary text-sm transition">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-ink-100 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-ink-400 order-2 md:order-1">
            © {new Date().getFullYear()} Mondocteur. Tous droits réservés.
          </p>
          <div className="flex items-center gap-6 order-1 md:order-2">
            <div className="hidden sm:flex items-center gap-5 text-sm text-ink-400">
              <Link href="/terms" className="hover:text-primary transition">Conditions d&apos;utilisation</Link>
              <Link href="/privacy" className="hover:text-primary transition">Politique de confidentialité</Link>
            </div>
            <div className="flex gap-2">
              {socials.map(s => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="w-9 h-9 bg-white border border-ink-100 hover:border-primary hover:text-primary rounded-lg flex items-center justify-center text-ink-400 transition text-xs font-bold"
                >
                  {s.letter}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
