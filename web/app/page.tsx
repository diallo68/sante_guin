import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight, Search, MapPin,
  ChevronRight, FlaskConical, User, Store,
} from 'lucide-react';
import InstallAppButton from '@/components/InstallAppButton';

const quickAccess = [
  { label: 'Généraliste', icon: <User size={15} /> },
  { label: 'Pédiatre', icon: <User size={15} /> },
  { label: 'Cardiologue', icon: <User size={15} /> },
  { label: 'Pharmacie ouverte', icon: <Store size={15} /> },
];

const services = [
  { title: 'Médecins', desc: 'Trouvez et prenez rendez-vous avec des professionnels de santé près de chez vous.', href: '/doctors', icon: <User className="w-6 h-6 text-primary" /> },
  { title: 'Pharmacies', desc: 'Localisez les pharmacies et trouvez celles ouvertes autour de vous.', href: '/pharmacies', icon: <Store className="w-6 h-6 text-primary" /> },
  { title: 'Laboratoires', desc: "Trouvez un laboratoire d'analyses médicales près de chez vous.", href: '/laboratories', icon: <FlaskConical className="w-6 h-6 text-primary" /> },
];

async function getStats() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/stats`, {
      next: { revalidate: 300 }, // revalide toutes les 5 min
    });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch {
    return { doctors: null, pharmacies: null, patients: null, avgRating: null };
  }
}

function formatCount(n: number | null, suffix = '+') {
  if (n === null) return '—';
  if (n >= 1000) return `${(n / 1000).toFixed(0)} 000${suffix}`;
  return `${n}${suffix}`;
}

export default async function Home() {
  const s = await getStats();
  const stats = [
    { value: formatCount(s.doctors), label: 'Médecins certifiés' },
    { value: formatCount(s.pharmacies), label: 'Pharmacies partenaires' },
    { value: formatCount(s.patients), label: 'Patients satisfaits' },
    { value: s.avgRating !== null ? `${s.avgRating}/5` : '—', label: 'Note moyenne' },
  ];
  return (
    <div className="min-h-screen bg-white">

      {/* ── HERO ── */}
      <section className="bg-mist-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

            {/* Texte + recherche */}
            <div className="min-w-0">
              <span className="text-primary text-xs font-bold uppercase tracking-widest">Santé en Guinée</span>
              <h1 className="text-4xl md:text-5xl font-extrabold text-ink-900 mt-2 mb-4 leading-tight">
                Votre santé, <span className="text-primary">simplement.</span>
              </h1>
              <p className="text-ink-400 text-lg mb-8 leading-relaxed max-w-md">
                Trouvez un professionnel de santé près de chez vous et prenez rendez-vous en quelques minutes.
              </p>

              {/* Barre de recherche */}
              {/* min-w-0 sur les 2 wrappers : sans ça, un flex-item qui est
                  lui-même un conteneur flex garde pour largeur minimale la
                  taille de son contenu (règle du "automatic minimum size").
                  Safari l'applique plus strictement que Chrome : le bouton
                  "Rechercher" (whitespace-nowrap, donc non compressible)
                  se retrouvait poussé hors de la colonne et passait sous la
                  photo — signalé par l'utilisateur, non reproduit en local
                  faute de Safari sous la main. */}
              <form action="/doctors" className="flex flex-col sm:flex-row gap-3 mb-5">
                <div className="flex-1 min-w-0 flex items-center gap-2 bg-white border border-ink-100 rounded-xl px-4 py-3 shadow-sm">
                  <Search size={16} className="text-ink-400 flex-shrink-0" />
                  <input
                    name="search"
                    type="text"
                    placeholder="Professionnel ou spécialité"
                    className="flex-1 min-w-0 outline-none bg-transparent text-sm text-ink-900 placeholder-ink-400"
                  />
                </div>
                <div className="flex-1 min-w-0 flex items-center gap-2 bg-white border border-ink-100 rounded-xl px-4 py-3 shadow-sm">
                  <MapPin size={16} className="text-ink-400 flex-shrink-0" />
                  <input
                    name="city"
                    type="text"
                    placeholder="Ville ou quartier"
                    className="flex-1 min-w-0 outline-none bg-transparent text-sm text-ink-900 placeholder-ink-400"
                  />
                </div>
                <button type="submit" className="flex-shrink-0 flex items-center justify-center gap-2 bg-primary hover:bg-ink-700 text-white font-bold px-6 py-3 rounded-xl transition shadow-sm whitespace-nowrap">
                  <Search size={16} /> Rechercher
                </button>
              </form>

              {/* Accès rapides */}
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-ink-400 text-sm mr-1">Accès rapides :</span>
                {quickAccess.map(q => (
                  <Link
                    key={q.label}
                    href={`/doctors?search=${encodeURIComponent(q.label)}`}
                    className="inline-flex items-center gap-1.5 text-sm bg-white border border-ink-100 hover:border-primary hover:text-primary text-ink-700 px-3 py-1.5 rounded-full transition"
                  >
                    {q.icon} {q.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Photo */}
            <div className="relative rounded-3xl overflow-hidden shadow-lg aspect-[16/10] lg:aspect-auto lg:h-full lg:min-h-[360px]">
              <Image
                src="/marketing/hero-photo.jpg"
                alt="Une mère et sa fille en consultation avec une médecin"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10 pb-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {services.map(s => (
            <Link key={s.title} href={s.href as any} className="group bg-white rounded-2xl shadow-md border border-ink-50 p-6 flex items-center gap-4 hover:shadow-lg hover:border-primary/30 transition">
              <div className="w-14 h-14 bg-mist-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                {s.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-ink-900">{s.title}</h3>
                <p className="text-sm text-ink-400 mt-0.5">{s.desc}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-ink-400 group-hover:text-primary group-hover:translate-x-0.5 transition flex-shrink-0" />
            </Link>
          ))}
        </div>
      </section>

      {/* ── PATIENTS / PROFESSIONNELS ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-mist-50 rounded-2xl p-6 flex items-center gap-5">
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0">
              <Image src="/marketing/patients-illustration.jpg" alt="Patiente utilisant Mondocteur" fill className="object-cover" />
            </div>
            <div>
              <h3 className="font-bold text-ink-900 text-lg mb-1">Patients</h3>
              <p className="text-ink-400 text-sm mb-3">Un accès plus simple aux soins, pour vous et vos proches.</p>
              <Link href="/doctors" className="inline-flex items-center gap-1.5 bg-primary hover:bg-ink-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition">
                En savoir plus <ArrowRight size={14} />
              </Link>
            </div>
          </div>
          <div className="bg-mist-50 rounded-2xl p-6 flex items-center gap-5">
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0">
              <Image src="/marketing/pro-illustration.jpg" alt="Médecin utilisant Mondocteur Pro" fill className="object-cover" />
            </div>
            <div>
              <h3 className="font-bold text-ink-900 text-lg mb-1">Professionnels de santé</h3>
              <p className="text-ink-400 text-sm mb-3">Développez votre activité et facilitez la prise de rendez-vous de vos patients.</p>
              <Link href="/pro-avantages" className="inline-flex items-center gap-1.5 border-2 border-primary text-primary hover:bg-primary hover:text-white text-sm font-semibold px-4 py-2 rounded-lg transition">
                Espace Pro <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── HAM — bandeau compact ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="rounded-2xl bg-gradient-to-r from-ink-900 to-primary px-6 py-5 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
            <Image src="/marketing/ham-icon.jpg" alt="Ham, l'assistant IA" fill className="object-cover" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-white font-bold">Ham · Assistant pour professionnels</h3>
            <p className="text-mist-100/80 text-sm">Un assistant intelligent pour vous accompagner au quotidien dans la gestion de votre activité.</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {/* Installation directe sur PC (PWA) — réservée aux abonnés Pro */}
            <InstallAppButton />
            <Link href="/pro/ai" className="inline-flex items-center gap-2 bg-white text-ink-900 font-bold px-5 py-2.5 rounded-xl hover:bg-mist-100 transition whitespace-nowrap">
              Découvrir Ham <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-ink-50 p-6 text-center hover:shadow-md transition">
              <p className="text-3xl font-bold text-primary mb-1">{s.value}</p>
              <p className="text-sm text-ink-400 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
