import Link from 'next/link';
import {
  ArrowRight, Search, Star, MapPin, Clock, CheckCircle,
  Stethoscope, Calendar, FileText, BarChart3, MessageSquare,
  Shield, Zap, Users, Phone, ChevronRight, Package, FlaskConical,
  BrainCircuit, ImageIcon, Microscope, Pill,
} from 'lucide-react';
import InstallAppButton from '@/components/InstallAppButton';

const proSubscribers = [
  { id: '1', name: 'Dr. Ahmed Diallo', type: 'doctor', specialty: 'Cardiologue', address: 'Kaloum, Conakry', rating: 4.8, reviews: 124, hours: '08:00 - 18:00', href: '/doctors' },
  { id: '2', name: 'Dr. Aïssatou Diop', type: 'doctor', specialty: 'Pédiatre', address: 'Ratoma, Conakry', rating: 4.9, reviews: 156, hours: '09:00 - 17:00', href: '/doctors' },
  { id: '3', name: 'Dr. Fatou Sow', type: 'doctor', specialty: 'Généraliste', address: 'Plateau, Conakry', rating: 4.6, reviews: 89, hours: '08:00 - 17:00', href: '/doctors' },
  { id: '4', name: 'Pharmacie Centrale', type: 'pharmacy', address: 'Plateau, Conakry', rating: 4.6, reviews: 98, hours: '08:00 - 22:00', href: '/pharmacies' },
  { id: '5', name: 'Pharmacie Santé Plus', type: 'pharmacy', address: 'Dixinn, Conakry', rating: 4.8, reviews: 203, hours: '24h/24', href: '/pharmacies' },
  { id: '6', name: 'Pharmacie du Plateau', type: 'pharmacy', address: 'Plateau, Conakry', rating: 4.5, reviews: 98, hours: '07:00 - 23:00', href: '/pharmacies' },
  { id: '7', name: 'Labo BioSanté', type: 'laboratory', address: 'Kaloum, Conakry', rating: 4.7, reviews: 64, hours: '07:00 - 18:00', href: '/laboratories' },
  { id: '8', name: 'Centre d\'Analyses Moderne', type: 'laboratory', address: 'Ratoma, Conakry', rating: 4.5, reviews: 41, hours: '07:30 - 17:30', href: '/laboratories' },
  { id: '9', name: 'Laboratoire Conakry Med', type: 'laboratory', address: 'Dixinn, Conakry', rating: 4.8, reviews: 87, hours: '07:00 - 19:00', href: '/laboratories' },
];

const steps = [
  { num: '01', icon: <Search className="w-6 h-6" />, title: 'Recherchez', desc: 'Trouvez un médecin par spécialité, nom ou localisation à Conakry et partout en Guinée.' },
  { num: '02', icon: <Calendar className="w-6 h-6" />, title: 'Réservez', desc: 'Choisissez un créneau disponible et confirmez votre rendez-vous en quelques secondes.' },
  { num: '03', icon: <CheckCircle className="w-6 h-6" />, title: 'Consultez', desc: 'Rendez-vous sur place ou en ligne. Recevez votre ordonnance directement sur l\'appli.' },
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
    <div className="min-h-screen bg-gray-50">

      {/* ── HERO ── */}
      <section className="relative bg-gradient-to-br from-teal-700 via-teal-600 to-cyan-600 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white bg-opacity-15 text-white text-sm font-semibold px-4 py-2 rounded-full mb-6 backdrop-blur-sm">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Disponible à Conakry et partout en Guinée
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Votre santé,{' '}
              <span className="text-cyan-200">entre de bonnes mains</span>
            </h1>
            <p className="text-lg md:text-xl text-teal-100 mb-10 leading-relaxed">
              Trouvez le bon médecin, prenez rendez-vous en ligne et gérez votre santé facilement depuis votre téléphone ou ordinateur.
            </p>

            {/* Quick links */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
              <span className="text-teal-200 text-sm">Populaires :</span>
              {['Généraliste', 'Cardiologue', 'Pédiatre', 'Pharmacie 24h'].map(s => (
                <Link
                  key={s}
                  href={`/doctors?search=${encodeURIComponent(s)}`}
                  className="text-sm bg-white bg-opacity-15 hover:bg-opacity-25 text-white px-3 py-1 rounded-full transition backdrop-blur-sm"
                >
                  {s}
                </Link>
              ))}
            </div>

          </div>
        </div>

        {/* Wave bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 60L1440 60L1440 30C1200 60 960 0 720 0C480 0 240 60 0 30L0 60Z" fill="#f9fafb" />
          </svg>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-2 pb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center hover:shadow-md transition">
              <p className="text-3xl font-bold text-teal-700 mb-1">{s.value}</p>
              <p className="text-sm text-gray-500 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HAM — ASSISTANT IA ── */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-teal-900 shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">

              {/* Gauche — présentation */}
              <div className="p-10 md:p-14 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-14 h-14 bg-teal-500 bg-opacity-20 border border-teal-400 border-opacity-30 rounded-2xl flex items-center justify-center">
                    <BrainCircuit className="w-7 h-7 text-teal-300" />
                  </div>
                  <div>
                    <span className="text-teal-400 text-xs font-bold uppercase tracking-widest block">Intelligence Artificielle Médicale</span>
                    <h2 className="text-3xl md:text-4xl font-bold text-white">
                      Ham <span className="text-teal-400">·</span> Votre Collaborateur
                    </h2>
                  </div>
                </div>

                <p className="text-gray-300 text-lg leading-relaxed mb-8">
                  Ham est le premier assistant IA médical conçu pour les professionnels de santé en Guinée. Disponible 24h/24, il analyse vos examens, interprète vos ordonnances et vous aide à prendre les meilleures décisions cliniques.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
                  {[
                    { icon: <Microscope size={16} />, text: 'Interprétation de résultats biologiques' },
                    { icon: <ImageIcon size={16} />, text: 'Analyse d\'images médicales' },
                    { icon: <Pill size={16} />, text: 'Interactions médicamenteuses' },
                    { icon: <FileText size={16} />, text: 'Rédaction d\'ordonnances' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2.5 bg-white bg-opacity-5 rounded-xl px-4 py-3 border border-white border-opacity-10">
                      <span className="text-teal-400 flex-shrink-0">{item.icon}</span>
                      <span className="text-gray-300 text-sm">{item.text}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/pro/ai" className="inline-flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-400 text-white font-bold py-3 px-7 rounded-xl transition shadow-lg">
                    <BrainCircuit size={18} /> Essayer Ham
                  </Link>
                  <Link href="/pro-avantages" className="inline-flex items-center justify-center gap-2 bg-white bg-opacity-10 hover:bg-opacity-20 text-white font-semibold py-3 px-7 rounded-xl transition border border-white border-opacity-20">
                    En savoir plus <ArrowRight size={16} />
                  </Link>
                </div>
              </div>

              {/* Droite — interface chat simulée */}
              <div className="p-8 md:p-10 flex items-center justify-center border-t lg:border-t-0 lg:border-l border-white border-opacity-10">
                <div className="w-full max-w-sm bg-white bg-opacity-5 rounded-2xl border border-white border-opacity-10 p-5 space-y-4">
                  <div className="flex items-center gap-2 border-b border-white border-opacity-10 pb-4">
                    <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center">
                      <BrainCircuit size={16} className="text-white" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">Ham</p>
                      <p className="text-teal-400 text-xs flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" /> En ligne</p>
                    </div>
                  </div>

                  {/* Message médecin */}
                  <div className="flex justify-end">
                    <div className="bg-teal-600 text-white text-sm rounded-2xl rounded-tr-sm px-4 py-3 max-w-xs">
                      Patient de 34 ans, fièvre 39°C depuis 3 jours, frissons, céphalées. TDR paludisme positif. Quel protocole ?
                    </div>
                  </div>

                  {/* Réponse Ham */}
                  <div className="flex gap-2">
                    <div className="w-7 h-7 bg-teal-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <BrainCircuit size={13} className="text-white" />
                    </div>
                    <div className="bg-white bg-opacity-10 text-gray-200 text-sm rounded-2xl rounded-tl-sm px-4 py-3 max-w-xs leading-relaxed">
                      <p className="font-semibold text-teal-300 mb-1">Protocole paludisme simple :</p>
                      <p>• Artéméther-Luméfantrine 80/480 mg — 6 prises sur 3 jours</p>
                      <p className="mt-1">• Paracétamol 1g toutes les 6h si fièvre {'>'} 38,5°C</p>
                      <p className="mt-1 text-gray-400 text-xs">⚠️ Confirmer l&apos;absence de signes de gravité</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white border-opacity-10">
                    <div className="flex items-center gap-2 bg-white bg-opacity-5 rounded-xl px-3 py-2.5 text-gray-400 text-xs">
                      <span>Posez votre question à Ham…</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ── PRO + PARTENAIRES + COMMENT ÇA MARCHE — bloc unifié ── */}
      <section id="pro" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl overflow-hidden shadow-xl border border-gray-100">

            {/* Header */}
            <div className="bg-gradient-to-r from-slate-800 to-teal-900 px-8 md:px-12 py-10">
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-teal-500 bg-opacity-30 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Stethoscope className="w-7 h-7 text-teal-300" />
                  </div>
                  <div>
                    <span className="text-teal-400 text-xs font-bold uppercase tracking-widest">Pour les professionnels de santé</span>
                    <h2 className="text-2xl md:text-3xl font-bold text-white mt-1">
                      Mondocteur <span className="text-teal-400">Pro</span>
                    </h2>
                    <p className="text-gray-300 mt-1 text-sm">Gérez votre cabinet, vos patients et votre agenda en un seul endroit.</p>
                  </div>
                </div>
                <div className="lg:ml-auto flex-shrink-0">
                  <Link href="/pro-avantages" className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white font-bold py-3 px-7 rounded-xl transition shadow-lg">
                    Découvrir les avantages Pro <ArrowRight size={18} />
                  </Link>
                </div>
              </div>
            </div>

            <div className="bg-white grid grid-cols-1 lg:grid-cols-5">

              {/* Features - 3 cols */}
              <div className="lg:col-span-3 p-8 md:p-10 border-b lg:border-b-0 lg:border-r border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6">Fonctionnalités incluses</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { icon: <Calendar className="w-4 h-4 text-teal-600" />, title: 'Agenda en ligne', desc: 'Gestion des rendez-vous 24h/24' },
                    { icon: <FileText className="w-4 h-4 text-teal-600" />, title: 'Dossiers patients', desc: 'Ordonnances & documents numériques' },
                    { icon: <BarChart3 className="w-4 h-4 text-teal-600" />, title: 'Statistiques', desc: 'Tableau de bord complet' },
                    { icon: <MessageSquare className="w-4 h-4 text-teal-600" />, title: 'Messagerie sécurisée', desc: 'Communication directe patients' },
                    { icon: <Shield className="w-4 h-4 text-teal-600" />, title: 'Profil vérifié', desc: 'Badge Pro & mise en avant' },
                    { icon: <Zap className="w-4 h-4 text-teal-600" />, title: 'Rappels automatiques', desc: 'SMS aux patients avant RDV' },
                  ].map((feat, i) => (
                    <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 hover:bg-teal-50 transition">
                      <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">{feat.icon}</div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{feat.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{feat.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing - 2 cols */}
              <div className="lg:col-span-2 p-8 md:p-10">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6">Choisissez votre plan</p>
                <div className="space-y-3">

                  {/* Essentiel */}
                  <div className="flex items-center justify-between p-4 rounded-xl border-2 border-gray-100 hover:border-teal-200 hover:bg-teal-50 transition cursor-pointer">
                    <div>
                      <p className="font-bold text-gray-900 text-sm">Essentiel</p>
                      <p className="text-xs text-gray-400 mt-0.5">Sans engagement</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">50 000 <span className="text-xs text-gray-400 font-normal">FG/mois</span></p>
                    </div>
                  </div>

                  {/* Confort */}
                  <div className="flex items-center justify-between p-4 rounded-xl border-2 border-gray-100 hover:border-teal-200 hover:bg-teal-50 transition cursor-pointer">
                    <div>
                      <p className="font-bold text-gray-900 text-sm">Confort</p>
                      <p className="text-xs text-teal-600 font-semibold mt-0.5">−10% · 45 000 FG/mois</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">135 000 <span className="text-xs text-gray-400 font-normal">FG</span></p>
                    </div>
                  </div>

                  {/* Excellence */}
                  <div className="relative flex items-center justify-between p-4 rounded-xl border-2 border-teal-600 bg-gradient-to-r from-teal-50 to-cyan-50 cursor-pointer">
                    <div className="absolute -top-3 left-3">
                      <span className="bg-teal-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow">⭐ Meilleure offre</span>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">Excellence</p>
                      <p className="text-xs text-teal-600 font-semibold mt-0.5">−20% · 40 000 FG/mois</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-teal-700">480 000 <span className="text-xs text-gray-400 font-normal">FG</span></p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-gray-100 space-y-2">
                  {[
                    { icon: <Phone size={13} />, text: 'Paiement via Wave · Orange Money' },
                    { icon: <Shield size={13} />, text: 'Annulation à tout moment' },
                    { icon: <Users size={13} />, text: 'Support dédié 7j/7' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="text-teal-500">{item.icon}</span>
                      {item.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* ── PARTENAIRES VÉRIFIÉS ── */}
            <div className="bg-white px-8 md:px-12 py-10 border-t border-gray-100">
              <div className="flex items-end justify-between mb-10">
                <div>
                  <span className="text-teal-600 text-sm font-bold uppercase tracking-wider">Partenaires vérifiés</span>
                  <h2 className="text-3xl font-bold text-gray-900 mt-1">Professionnels de santé</h2>
                  <p className="text-gray-500 mt-1">Médecins, pharmacies et laboratoires certifiés, disponibles pour vous</p>
                </div>
                <div className="hidden md:flex items-center gap-4">
                  <Link href="/doctors" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm">
                    Tous les médecins <ArrowRight size={16} />
                  </Link>
                  <Link href="/pharmacies" className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-semibold text-sm">
                    Toutes les pharmacies <ArrowRight size={16} />
                  </Link>
                  <Link href="/laboratories" className="flex items-center gap-2 text-teal-600 hover:text-teal-700 font-semibold text-sm">
                    Tous les laboratoires <ArrowRight size={16} />
                  </Link>
                </div>
              </div>

              <div className="mb-4 flex items-center gap-2">
                <Stethoscope size={18} className="text-blue-600" />
                <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider">Médecins</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
                {proSubscribers.filter(p => p.type === 'doctor').map((p) => (
                  <Link key={p.id} href={p.href} className="bg-blue-50 border border-blue-100 rounded-2xl p-5 hover:shadow-lg hover:border-blue-300 transition-all group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">👨‍⚕️</div>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">Pro ✓</span>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-0.5">{p.name}</h3>
                    {'specialty' in p && p.specialty && (
                      <p className="text-sm text-blue-600 font-medium mb-3">{p.specialty}</p>
                    )}
                    <div className="space-y-1.5 mb-4">
                      <div className="flex items-center gap-1.5 text-gray-500 text-xs"><MapPin size={12} /> {p.address}</div>
                      <div className="flex items-center gap-1.5 text-gray-500 text-xs"><Clock size={12} /> {p.hours}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Star size={13} className="fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-bold text-gray-900">{p.rating}</span>
                        <span className="text-xs text-gray-400">({p.reviews})</span>
                      </div>
                      <span className="text-xs text-blue-600 font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">Voir <ChevronRight size={12} /></span>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="mb-4 flex items-center gap-2">
                <Package size={18} className="text-emerald-600" />
                <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider">Pharmacies</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
                {proSubscribers.filter(p => p.type === 'pharmacy').map((p) => (
                  <Link key={p.id} href={p.href} className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 hover:shadow-lg hover:border-emerald-300 transition-all group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">💊</div>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">Pro ✓</span>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-3">{p.name}</h3>
                    <div className="space-y-1.5 mb-4">
                      <div className="flex items-center gap-1.5 text-gray-500 text-xs"><MapPin size={12} /> {p.address}</div>
                      <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                        <Clock size={12} /> {p.hours}
                        {p.hours === '24h/24' && (
                          <span className="ml-1 bg-green-100 text-green-700 text-xs px-1.5 py-0.5 rounded-full font-bold">Ouvert</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Star size={13} className="fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-bold text-gray-900">{p.rating}</span>
                        <span className="text-xs text-gray-400">({p.reviews})</span>
                      </div>
                      <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">Voir <ChevronRight size={12} /></span>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="mb-4 flex items-center gap-2">
                <FlaskConical size={18} className="text-teal-600" />
                <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider">Laboratoires d&apos;analyse</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {proSubscribers.filter(p => p.type === 'laboratory').map((p) => (
                  <Link key={p.id} href={p.href} className="bg-teal-50 border border-teal-100 rounded-2xl p-5 hover:shadow-lg hover:border-teal-300 transition-all group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <FlaskConical size={24} className="text-teal-600" />
                      </div>
                      <span className="px-2 py-0.5 bg-teal-100 text-teal-700 text-xs font-bold rounded-full">Pro ✓</span>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-3">{p.name}</h3>
                    <div className="space-y-1.5 mb-4">
                      <div className="flex items-center gap-1.5 text-gray-500 text-xs"><MapPin size={12} /> {p.address}</div>
                      <div className="flex items-center gap-1.5 text-gray-500 text-xs"><Clock size={12} /> {p.hours}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Star size={13} className="fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-bold text-gray-900">{p.rating}</span>
                        <span className="text-xs text-gray-400">({p.reviews})</span>
                      </div>
                      <span className="text-xs text-teal-600 font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">Voir <ChevronRight size={12} /></span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* ── COMMENT ÇA MARCHE ── */}
            <div className="bg-gray-50 px-8 md:px-12 py-10 border-t border-gray-100">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-3">Comment ça marche ?</h2>
                <p className="text-gray-500 text-lg">Prendre rendez-vous n'a jamais été aussi simple</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {steps.map((step, i) => (
                  <div key={i} className="relative text-center">
                    {i < steps.length - 1 && (
                      <div className="hidden md:block absolute top-8 left-3/4 w-1/2 border-t-2 border-dashed border-teal-200 z-0" />
                    )}
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="w-16 h-16 bg-teal-600 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg">
                        {step.icon}
                      </div>
                      <span className="text-xs font-bold text-teal-500 uppercase tracking-widest mb-2">{step.num}</span>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                      <p className="text-gray-500 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PWA — Travaillez sans connexion ── */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl overflow-hidden bg-gradient-to-br from-teal-800 via-slate-800 to-slate-900 shadow-2xl px-8 md:px-12 py-12">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-white bg-opacity-10 text-teal-200 text-xs font-bold px-4 py-1.5 rounded-full mb-5 uppercase tracking-widest">
                Réservé aux abonnés Mondocteur Pro
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
                Continuez à travailler sans être connecté
              </h3>
              <p className="text-teal-200 text-sm leading-relaxed max-w-2xl mx-auto">
                Téléchargez l'application web Mondocteur sur votre PC ou téléphone. Accédez à vos patients, rédigez vos ordonnances et utilisez Ham même sans internet.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
              {/* Avantages */}
              <div className="bg-white bg-opacity-5 border border-white border-opacity-10 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 bg-green-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                    <CheckCircle size={16} className="text-green-400" />
                  </div>
                  <h4 className="font-bold text-white">Avantages</h4>
                </div>
                <ul className="space-y-4">
                  {[
                    { title: 'Accès hors ligne', desc: 'Consultez vos patients et documents sans connexion internet' },
                    { title: 'Installation sur le bureau', desc: "L'app s'ouvre comme un programme natif, sans navigateur" },
                    { title: 'Chargement ultra-rapide', desc: "Les pages sont mises en cache, l'app démarre instantanément" },
                    { title: 'Synchronisation automatique', desc: 'Toutes vos données se synchronisent dès le retour de la connexion' },
                    { title: 'Notifications de rendez-vous', desc: "Recevez les rappels même quand l'app est en arrière-plan" },
                    { title: 'Sans App Store', desc: 'Installez directement depuis votre navigateur Chrome ou Edge' },
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-5 h-5 bg-green-500 bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      </span>
                      <div>
                        <p className="text-white text-sm font-semibold">{item.title}</p>
                        <p className="text-teal-300 text-xs mt-0.5">{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Limites */}
              <div className="bg-white bg-opacity-5 border border-white border-opacity-10 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 bg-orange-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  </div>
                  <h4 className="font-bold text-white">Limites hors ligne</h4>
                </div>
                <ul className="space-y-4">
                  {[
                    { title: 'Ham (IA) indisponible', desc: "L'assistant IA nécessite une connexion pour interroger le modèle" },
                    { title: 'Messagerie en temps réel', desc: "Les nouveaux messages ne s'affichent pas sans internet" },
                    { title: 'Prise de rendez-vous en ligne', desc: "Les patients ne peuvent pas réserver sans connexion active" },
                    { title: 'Upload de documents', desc: "Les photos et fichiers sont mis en attente et envoyés à la reconnexion" },
                    { title: 'Pages non visitées', desc: "Seules les pages déjà ouvertes sont disponibles hors ligne" },
                    { title: 'Mises à jour de données', desc: "Les nouvelles informations (RDV, patients) ne se chargent pas hors ligne" },
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-5 h-5 bg-orange-500 bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-3 h-3 text-orange-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                      </span>
                      <div>
                        <p className="text-white text-sm font-semibold">{item.title}</p>
                        <p className="text-orange-200 text-xs mt-0.5">{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="text-center">
              <InstallAppButton />
              <p className="text-teal-400 text-xs mt-3">Compatible Chrome, Edge et Safari sur iOS · Abonnement Pro requis</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-50 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-900 text-white rounded-3xl px-8 md:px-12 py-12">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-10">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 bg-teal-500 rounded-xl flex items-center justify-center">
                  <Stethoscope size={20} className="text-white" />
                </div>
                <span className="text-xl font-bold">Mondocteur</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                La plateforme de santé numérique qui connecte les patients aux professionnels de santé en Guinée.
              </p>
              <div className="flex gap-3">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-slate-800 hover:bg-teal-600 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition text-xs font-bold">F</a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-slate-800 hover:bg-teal-600 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition text-xs font-bold">I</a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-slate-800 hover:bg-teal-600 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition text-xs font-bold">T</a>
              </div>
            </div>
            {([
              { title: 'Patients', links: [
                { label: 'Trouver un médecin', href: '/doctors' },
                { label: 'Trouver une pharmacie', href: '/pharmacies' },
                { label: 'Mon compte', href: '/profile' },
                { label: 'Mes rendez-vous', href: '/profile' },
              ]},
              { title: 'Professionnels', links: [
                { label: 'Espace Pro', href: '/pro' },
                { label: 'Comment ça marche', href: '/pro' },
                { label: 'Se connecter', href: '/auth/login' },
              ]},
              { title: 'Aide', links: [
                { label: 'Contact', href: 'mailto:support@guineesante.gn' },
                { label: 'WhatsApp', href: 'https://wa.me/224620000000' },
                { label: 'Conditions', href: '/legal/conditions' },
                { label: 'Confidentialité', href: '/legal/confidentialite' },
              ]},
            ] as { title: string; links: { label: string; href: string }[] }[]).map(col => (
              <div key={col.title}>
                <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.links.map(item => (
                    <li key={item.label}>
                      <Link href={item.href as any} className="text-gray-400 hover:text-teal-400 text-sm transition">{item.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <p>© 2026 Mondocteur. Tous droits réservés.</p>
            <p className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              Tous les systèmes sont opérationnels
            </p>
          </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
