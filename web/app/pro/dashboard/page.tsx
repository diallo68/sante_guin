'use client';

import { useState, useEffect } from 'react';
import { Calendar, Star, Clock, ArrowRight, Package, FlaskConical, Stethoscope, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface DoctorProfile {
  firstName: string;
  lastName: string;
  specialty: string;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  consultationFee?: number;
}

interface PharmacyProfile {
  name: string;
  city: string;
  address: string;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  isOpen24h: boolean;
  openTime?: string;
  closeTime?: string;
}

interface LaboratoryProfile {
  name: string;
  city: string;
  address: string;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  analyses: string[];
}

interface DoctorStats {
  todayAppointments: number;
  monthAppointments: number;
  pendingAppointments: number;
  upcomingAppointments: any[];
}

interface DashboardData {
  role: 'doctor' | 'pharmacist' | 'laboratorist';
  profile: DoctorProfile | PharmacyProfile | LaboratoryProfile | null;
  stats?: DoctorStats;
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  cancelled: 'bg-red-100 text-red-800',
};
const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Confirmé',
  pending: 'En attente',
  cancelled: 'Annulé',
};

// ── Dashboard Médecin ──
function DoctorDashboard({ profile, stats }: { profile: DoctorProfile | null; stats: DoctorStats }) {
  const statCards = [
    { label: "Aujourd'hui", value: stats.todayAppointments, sub: 'rendez-vous', icon: Calendar, color: 'bg-blue-100 text-blue-600' },
    { label: 'Ce mois', value: stats.monthAppointments, sub: 'rendez-vous', icon: Clock, color: 'bg-green-100 text-green-600' },
    { label: 'En attente', value: stats.pendingAppointments, sub: 'à confirmer', icon: AlertCircle, color: 'bg-yellow-100 text-yellow-600' },
    { label: 'Note', value: profile ? `${profile.rating.toFixed(1)}/5` : '—', sub: profile ? `${profile.reviewCount} avis` : 'aucun avis', icon: Star, color: 'bg-purple-100 text-purple-600' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Tableau de Bord</h1>
          {profile ? (
            <p className="text-gray-600 mt-1 flex items-center gap-2">
              <Stethoscope size={16} className="text-teal-600" />
              Dr. {profile.firstName} {profile.lastName} — {profile.specialty}
              {profile.isVerified && <CheckCircle size={14} className="text-teal-500" />}
            </p>
          ) : (
            <p className="text-gray-500 mt-1">Bienvenue dans votre espace professionnel</p>
          )}
        </div>
        <Link href="/pro/appointments" className="bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition font-semibold text-sm">
          + Rendez-vous
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
                <Icon size={20} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-sm font-medium text-gray-700 mt-0.5">{s.label}</p>
              <p className="text-xs text-gray-400">{s.sub}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-800">Prochains rendez-vous</h2>
            <Link href="/pro/appointments" className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm">
              Voir tous <ArrowRight size={14} />
            </Link>
          </div>
          {stats.upcomingAppointments.length === 0 ? (
            <div className="text-center py-10">
              <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Aucun rendez-vous à venir</p>
              {!profile && (
                <p className="text-xs text-gray-400 mt-2">
                  <Link href="/pro/profile" className="text-blue-600">Compléter votre profil</Link> pour recevoir des rendez-vous
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {stats.upcomingAppointments.map((appt: any) => (
                <div key={appt._id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">
                      {appt.patientId?.firstName?.[0]}{appt.patientId?.lastName?.[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{appt.patientId?.firstName} {appt.patientId?.lastName}</p>
                      <p className="text-xs text-gray-400">{new Date(appt.date).toLocaleDateString('fr-FR')} à {appt.time}</p>
                      {appt.reason && <p className="text-xs text-gray-400">{appt.reason}</p>}
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[appt.status] || 'bg-gray-100 text-gray-700'}`}>
                    {STATUS_LABELS[appt.status] || appt.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-5">Actions rapides</h2>
          <div className="space-y-2">
            {[
              { href: '/pro/appointments', label: 'Gérer les rendez-vous', bg: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
              { href: '/pro/documents', label: 'Mes documents', bg: 'bg-green-50 text-green-700 hover:bg-green-100' },
              { href: '/pro/schedule', label: 'Gérer mes horaires', bg: 'bg-purple-50 text-purple-700 hover:bg-purple-100' },
              { href: '/pro/profile', label: 'Éditer mon profil', bg: 'bg-teal-50 text-teal-700 hover:bg-teal-100' },
              { href: '/pro/reviews', label: 'Voir mes avis', bg: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100' },
            ].map(item => (
              <Link key={item.href} href={item.href} className={`block w-full p-3 rounded-xl transition text-sm font-medium ${item.bg}`}>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Dashboard Pharmacie ──
function PharmacyDashboard({ profile }: { profile: PharmacyProfile | null }) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Tableau de Bord</h1>
        {profile ? (
          <p className="text-gray-600 mt-1 flex items-center gap-2">
            <Package size={16} className="text-emerald-600" />
            {profile.name} — {profile.city}
            {profile.isVerified && <CheckCircle size={14} className="text-teal-500" />}
          </p>
        ) : (
          <p className="text-gray-500 mt-1">Bienvenue dans votre espace professionnel</p>
        )}
      </div>

      {profile ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Note moyenne', value: `${profile.rating.toFixed(1)}/5`, sub: `${profile.reviewCount} avis`, icon: Star, color: 'bg-yellow-100 text-yellow-600' },
              { label: 'Statut', value: profile.isOpen24h ? '24h/24' : 'Horaires fixes', sub: profile.isOpen24h ? 'Ouvert en continu' : `${profile.openTime || '08:00'} – ${profile.closeTime || '20:00'}`, icon: Clock, color: 'bg-blue-100 text-blue-600' },
              { label: 'Vérification', value: profile.isVerified ? 'Vérifié' : 'En attente', sub: profile.isVerified ? 'Profil approuvé' : 'En cours de vérification', icon: CheckCircle, color: profile.isVerified ? 'bg-teal-100 text-teal-600' : 'bg-gray-100 text-gray-500' },
              { label: 'Ville', value: profile.city, sub: profile.address, icon: Package, color: 'bg-emerald-100 text-emerald-600' },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
                    <Icon size={20} />
                  </div>
                  <p className="text-xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-sm font-medium text-gray-700 mt-0.5">{s.label}</p>
                  <p className="text-xs text-gray-400 truncate">{s.sub}</p>
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 max-w-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-5">Actions rapides</h2>
            <div className="space-y-2">
              {[
                { href: '/pro/profile', label: 'Éditer mon profil', bg: 'bg-teal-50 text-teal-700 hover:bg-teal-100' },
                { href: '/pro/reviews', label: 'Voir mes avis', bg: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100' },
                { href: '/pro/schedule', label: 'Gérer mes horaires', bg: 'bg-purple-50 text-purple-700 hover:bg-purple-100' },
                { href: '/pro/messages', label: 'Mes messages', bg: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
              ].map(item => (
                <Link key={item.href} href={item.href} className={`block w-full p-3 rounded-xl transition text-sm font-medium ${item.bg}`}>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
          <Package size={40} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">Votre profil pharmacie n'est pas encore configuré.</p>
          <Link href="/pro/profile" className="inline-block bg-teal-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-teal-700 transition">
            Créer mon profil
          </Link>
        </div>
      )}
    </div>
  );
}

// ── Dashboard Laboratoire ──
function LaboratoryDashboard({ profile }: { profile: LaboratoryProfile | null }) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Tableau de Bord</h1>
        {profile ? (
          <p className="text-gray-600 mt-1 flex items-center gap-2">
            <FlaskConical size={16} className="text-purple-600" />
            {profile.name} — {profile.city}
            {profile.isVerified && <CheckCircle size={14} className="text-teal-500" />}
          </p>
        ) : (
          <p className="text-gray-500 mt-1">Bienvenue dans votre espace professionnel</p>
        )}
      </div>

      {profile ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Note moyenne', value: `${profile.rating.toFixed(1)}/5`, sub: `${profile.reviewCount} avis`, icon: Star, color: 'bg-yellow-100 text-yellow-600' },
              { label: 'Analyses proposées', value: profile.analyses.length, sub: 'types d\'analyses', icon: FlaskConical, color: 'bg-purple-100 text-purple-600' },
              { label: 'Vérification', value: profile.isVerified ? 'Vérifié' : 'En attente', sub: profile.isVerified ? 'Profil approuvé' : 'En cours', icon: CheckCircle, color: profile.isVerified ? 'bg-teal-100 text-teal-600' : 'bg-gray-100 text-gray-500' },
              { label: 'Ville', value: profile.city, sub: profile.address, icon: FlaskConical, color: 'bg-blue-100 text-blue-600' },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
                    <Icon size={20} />
                  </div>
                  <p className="text-xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-sm font-medium text-gray-700 mt-0.5">{s.label}</p>
                  <p className="text-xs text-gray-400 truncate">{s.sub}</p>
                </div>
              );
            })}
          </div>

          {profile.analyses.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FlaskConical size={16} className="text-purple-500" /> Analyses disponibles
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.analyses.map((a, i) => (
                  <span key={i} className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm font-medium">{a}</span>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 max-w-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-5">Actions rapides</h2>
            <div className="space-y-2">
              {[
                { href: '/pro/profile', label: 'Éditer mon profil', bg: 'bg-teal-50 text-teal-700 hover:bg-teal-100' },
                { href: '/pro/reviews', label: 'Voir mes avis', bg: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100' },
                { href: '/pro/messages', label: 'Mes messages', bg: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
              ].map(item => (
                <Link key={item.href} href={item.href} className={`block w-full p-3 rounded-xl transition text-sm font-medium ${item.bg}`}>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
          <FlaskConical size={40} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">Votre profil laboratoire n'est pas encore configuré.</p>
          <Link href="/pro/profile" className="inline-block bg-teal-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-teal-700 transition">
            Créer mon profil
          </Link>
        </div>
      )}
    </div>
  );
}

// ── Page principale ──
export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/pro/dashboard')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  if (data.role === 'doctor') {
    return (
      <DoctorDashboard
        profile={data.profile as DoctorProfile | null}
        stats={data.stats || { todayAppointments: 0, monthAppointments: 0, pendingAppointments: 0, upcomingAppointments: [] }}
      />
    );
  }

  if (data.role === 'pharmacist') {
    return <PharmacyDashboard profile={data.profile as PharmacyProfile | null} />;
  }

  if (data.role === 'laboratorist') {
    return <LaboratoryDashboard profile={data.profile as LaboratoryProfile | null} />;
  }

  return null;
}
