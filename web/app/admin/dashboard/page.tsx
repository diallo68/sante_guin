'use client';

import { useState, useEffect } from 'react';
import { Users, Stethoscope, Calendar, ShieldCheck, UserPlus, Clock, CheckCircle, Package, FlaskConical } from 'lucide-react';

interface Stats {
  totalUsers: number;
  totalDoctors: number;
  verifiedDoctors: number;
  totalPharmacies: number;
  totalLaboratories: number;
  totalAppointments: number;
  pendingAppointments: number;
  confirmedAppointments: number;
  newUsersThisMonth: number;
  roleBreakdown: { _id: string; count: number }[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(data => setStats(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    { label: 'Utilisateurs total', value: stats.totalUsers, icon: Users, color: 'bg-blue-500', sub: `+${stats.newUsersThisMonth} ce mois` },
    { label: 'Médecins inscrits', value: stats.totalDoctors, icon: Stethoscope, color: 'bg-teal-500', sub: `${stats.verifiedDoctors} vérifiés` },
    { label: 'Pharmacies', value: stats.totalPharmacies, icon: Package, color: 'bg-emerald-500', sub: 'partenaires actifs' },
    { label: 'Laboratoires', value: stats.totalLaboratories ?? 0, icon: FlaskConical, color: 'bg-purple-500', sub: 'analyses médicales' },
    { label: 'Rendez-vous total', value: stats.totalAppointments, icon: Calendar, color: 'bg-indigo-500', sub: `${stats.pendingAppointments} en attente` },
  ];

  const roleMap: Record<string, string> = {
    patient: 'Patients',
    doctor: 'Médecins',
    pharmacist: 'Pharmaciens',
    laboratorist: 'Laborantins',
    admin: 'Admins',
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Tableau de bord</h2>
        <p className="text-gray-500 text-sm mt-1">Vue globale de la plateforme</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-11 h-11 ${c.color} rounded-xl flex items-center justify-center`}>
                  <Icon size={22} className="text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{c.value}</p>
              <p className="text-sm font-medium text-gray-700 mt-1">{c.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{c.sub}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Répartition des rôles */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
            <Users size={18} className="text-blue-600" /> Répartition des utilisateurs
          </h3>
          <div className="space-y-3">
            {stats.roleBreakdown.map(r => (
              <div key={r._id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                  <span className="text-sm text-gray-700">{roleMap[r._id] || r._id}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-500 rounded-full"
                      style={{ width: `${Math.round((r.count / stats.totalUsers) * 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-900 w-8 text-right">{r.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rendez-vous par statut */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
            <Calendar size={18} className="text-purple-600" /> Rendez-vous par statut
          </h3>
          <div className="space-y-4">
            {[
              { label: 'En attente', value: stats.pendingAppointments, icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50' },
              { label: 'Confirmés', value: stats.confirmedAppointments, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className={`flex items-center justify-between p-4 rounded-xl ${s.bg}`}>
                  <div className="flex items-center gap-3">
                    <Icon size={18} className={s.color} />
                    <span className="text-sm font-medium text-gray-700">{s.label}</span>
                  </div>
                  <span className={`text-xl font-bold ${s.color}`}>{s.value}</span>
                </div>
              );
            })}
            <div className="flex items-center justify-between p-4 rounded-xl bg-blue-50">
              <div className="flex items-center gap-3">
                <ShieldCheck size={18} className="text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Médecins vérifiés</span>
              </div>
              <span className="text-xl font-bold text-blue-600">{stats.verifiedDoctors} / {stats.totalDoctors}</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-purple-50">
              <div className="flex items-center gap-3">
                <UserPlus size={18} className="text-purple-600" />
                <span className="text-sm font-medium text-gray-700">Nouveaux inscrits ce mois</span>
              </div>
              <span className="text-xl font-bold text-purple-600">{stats.newUsersThisMonth}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
