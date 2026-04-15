'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Users, FileText, DollarSign, TrendingUp, Settings, LogOut } from 'lucide-react';

interface StatCard {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
  color: string;
}

const stats: StatCard[] = [
  {
    title: 'Utilisateurs Pro',
    value: '248',
    change: '+12% ce mois',
    icon: <Users size={24} />,
    color: 'bg-blue-100 text-blue-600',
  },
  {
    title: 'Demandes en attente',
    value: '15',
    change: '3 nouvelles',
    icon: <FileText size={24} />,
    color: 'bg-orange-100 text-orange-600',
  },
  {
    title: 'Revenus mensuels',
    value: '45.2M FG',
    change: '+8% ce mois',
    icon: <DollarSign size={24} />,
    color: 'bg-green-100 text-green-600',
  },
  {
    title: 'Croissance',
    value: '23%',
    change: 'Année sur année',
    icon: <TrendingUp size={24} />,
    color: 'bg-purple-100 text-purple-600',
  },
];

const recentRequests = [
  {
    id: 1,
    name: 'Dr. Mamadou Camara',
    type: 'Médecin',
    plan: 'Pro Annuel',
    date: '2026-04-15',
    status: 'pending',
  },
  {
    id: 2,
    name: 'Pharmacie Nouvelle',
    type: 'Pharmacie',
    plan: 'Pro Mensuel',
    date: '2026-04-14',
    status: 'pending',
  },
  {
    id: 3,
    name: 'Dr. Aïssatou Ba',
    type: 'Médecin',
    plan: 'Pro 3 Mois',
    date: '2026-04-13',
    status: 'approved',
  },
];

const adminMenuItems = [
  { icon: FileText, label: 'Demandes d\'abonnement', href: '/admin/subscriptions' },
  { icon: Users, label: 'Gestion des utilisateurs', href: '/admin/users' },
  { icon: Settings, label: 'Rôles et permissions', href: '/admin/roles' },
  { icon: TrendingUp, label: 'Rapports', href: '/admin/reports' },
];

export default function AdminDashboard() {
  const [userRole] = useState('Super Admin');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-600 hover:text-gray-900">
              ← Accueil
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Tableau de bord Admin</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
              {userRole}
            </span>
            <button className="text-gray-600 hover:text-gray-900">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center mb-4`}>
                {stat.icon}
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-1">{stat.title}</h3>
              <p className="text-2xl font-bold text-gray-900 mb-2">{stat.value}</p>
              <p className="text-xs text-gray-600">{stat.change}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Requests */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Demandes récentes</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {recentRequests.map(request => (
                <div key={request.id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{request.name}</h3>
                      <p className="text-sm text-gray-600">{request.type}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      request.status === 'approved'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {request.status === 'approved' ? 'Approuvée' : 'En attente'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{request.plan}</span>
                    <span>{new Date(request.date).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-200">
              <Link href="/admin/subscriptions" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                Voir toutes les demandes →
              </Link>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Actions rapides</h2>
            </div>
            <div className="space-y-2 p-6">
              {adminMenuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition text-gray-900"
                  >
                    <Icon size={20} className="text-blue-600" />
                    <span className="font-medium">{item.label}</span>
                    <span className="ml-auto text-gray-400">→</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
