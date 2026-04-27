'use client';

import { useState, useEffect } from 'react';
import { Calendar, Users, TrendingUp, Plus, ArrowRight, BarChart3, Clock } from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  todayAppointments: number;
  monthAppointments: number;
  pendingAppointments: number;
  upcomingAppointments: any[];
}

interface DoctorProfile {
  firstName: string;
  lastName: string;
  specialty: string;
  rating: number;
  reviewCount: number;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'confirmed': return 'bg-green-100 text-green-800';
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'confirmed': return 'Confirmé';
    case 'pending': return 'En attente';
    case 'cancelled': return 'Annulé';
    default: return status;
  }
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    todayAppointments: 0,
    monthAppointments: 0,
    pendingAppointments: 0,
    upcomingAppointments: [],
  });
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/pro/dashboard')
      .then(r => r.json())
      .then(data => {
        if (data.stats) setStats(data.stats);
        if (data.doctor) setDoctor(data.doctor);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    {
      label: "Rendez-vous Aujourd'hui",
      value: stats.todayAppointments,
      sub: 'confirmés ou en attente',
      icon: <Calendar className="w-6 h-6" />,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      label: 'Ce Mois',
      value: stats.monthAppointments,
      sub: 'rendez-vous ce mois',
      icon: <Users className="w-6 h-6" />,
      color: 'bg-green-100 text-green-600',
    },
    {
      label: 'En Attente',
      value: stats.pendingAppointments,
      sub: 'à confirmer',
      icon: <Clock className="w-6 h-6" />,
      color: 'bg-yellow-100 text-yellow-600',
    },
    {
      label: 'Note Moyenne',
      value: doctor ? `${doctor.rating.toFixed(1)}/5` : '—',
      sub: doctor ? `${doctor.reviewCount} avis` : 'pas encore de profil',
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'bg-purple-100 text-purple-600',
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Tableau de Bord</h1>
          {doctor ? (
            <p className="text-gray-600 mt-1">
              Dr. {doctor.firstName} {doctor.lastName} — {doctor.specialty}
            </p>
          ) : (
            <p className="text-gray-600 mt-1">Bienvenue dans votre espace professionnel</p>
          )}
        </div>
        <Link
          href="/pro/appointments"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 font-semibold"
        >
          <Plus size={20} />
          Nouveau Rendez-vous
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{stat.value}</p>
                <p className="text-gray-500 text-xs mt-1">{stat.sub}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rendez-vous à venir */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">Prochains Rendez-vous</h2>
            <Link href="/pro/appointments" className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm">
              Voir Tous <ArrowRight size={16} />
            </Link>
          </div>

          {stats.upcomingAppointments.length === 0 ? (
            <div className="text-center py-10">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Aucun rendez-vous à venir</p>
              {!doctor && (
                <p className="text-sm text-gray-400 mt-2">
                  Votre profil médecin n'est pas encore créé.{' '}
                  <Link href="/pro/profile" className="text-blue-600">Compléter le profil</Link>
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {stats.upcomingAppointments.map((appt: any) => (
                <div
                  key={appt._id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Calendar className="text-blue-600" size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">
                        {appt.patientId?.firstName} {appt.patientId?.lastName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(appt.date).toLocaleDateString('fr-FR')} à {appt.time}
                      </p>
                      {appt.reason && <p className="text-xs text-gray-400">{appt.reason}</p>}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appt.status)}`}>
                    {getStatusLabel(appt.status)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions rapides */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Actions Rapides</h2>
          <div className="space-y-3">
            {[
              { href: '/pro/appointments', label: 'Gérer Rendez-vous', color: 'blue' },
              { href: '/pro/documents', label: 'Uploader Documents', color: 'green' },
              { href: '/pro/schedule', label: 'Gérer Horaires', color: 'purple' },
              { href: '/pro/profile', label: 'Éditer Profil', color: 'yellow' },
              { href: '/pro/reviews', label: 'Voir Avis', color: 'pink' },
            ].map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`block w-full p-4 bg-${item.color}-50 hover:bg-${item.color}-100 text-${item.color}-600 rounded-lg transition text-center font-medium`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {doctor && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <BarChart3 size={18} />
                Votre Profil
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Spécialité</span>
                  <span className="font-semibold text-gray-800">{doctor.specialty}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Note</span>
                  <span className="font-semibold text-gray-800">⭐ {doctor.rating.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Avis</span>
                  <span className="font-semibold text-gray-800">{doctor.reviewCount}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
