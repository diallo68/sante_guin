'use client';

import { useState } from 'react';
import {
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  Plus,
  ArrowRight,
  BarChart3,
  Clock,
} from 'lucide-react';
import Link from 'next/link';

interface StatCard {
  label: string;
  value: string | number;
  change: string;
  icon: React.ReactNode;
  color: string;
}

interface Appointment {
  id: string;
  patientName: string;
  time: string;
  type: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}

export default function DashboardPage() {
  const stats: StatCard[] = [
    {
      label: 'Rendez-vous Aujourd\'hui',
      value: 8,
      change: '+2 depuis hier',
      icon: <Calendar className="w-6 h-6" />,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      label: 'Patients Actifs',
      value: 245,
      change: '+12 ce mois',
      icon: <Users className="w-6 h-6" />,
      color: 'bg-green-100 text-green-600',
    },
    {
      label: 'Revenus du Mois',
      value: '2,450,000 GNF',
      change: '+15% vs mois dernier',
      icon: <DollarSign className="w-6 h-6" />,
      color: 'bg-purple-100 text-purple-600',
    },
    {
      label: 'Taux de Satisfaction',
      value: '4.8/5',
      change: '+0.2 depuis le mois dernier',
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'bg-yellow-100 text-yellow-600',
    },
  ];

  const upcomingAppointments: Appointment[] = [
    {
      id: '1',
      patientName: 'Mamadou Diallo',
      time: '10:00 AM',
      type: 'Consultation Générale',
      status: 'confirmed',
    },
    {
      id: '2',
      patientName: 'Aissatou Bah',
      time: '11:30 AM',
      type: 'Suivi Post-Opératoire',
      status: 'confirmed',
    },
    {
      id: '3',
      patientName: 'Ibrahima Sow',
      time: '2:00 PM',
      type: 'Consultation Spécialisée',
      status: 'pending',
    },
    {
      id: '4',
      patientName: 'Fatoumata Diallo',
      time: '3:30 PM',
      type: 'Consultation Générale',
      status: 'confirmed',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmé';
      case 'pending':
        return 'En Attente';
      case 'cancelled':
        return 'Annulé';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Tableau de Bord</h1>
          <p className="text-gray-600 mt-2">Bienvenue dans votre espace professionnel</p>
        </div>
        <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
          <Plus size={20} />
          Nouveau Rendez-vous
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{stat.value}</p>
                <p className="text-green-600 text-xs font-medium mt-2">{stat.change}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">Rendez-vous à Venir</h2>
            <Link
              href="/pro/appointments"
              className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
            >
              Voir Tous
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="space-y-4">
            {upcomingAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Calendar className="text-blue-600" size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{appointment.patientName}</p>
                    <p className="text-sm text-gray-600">{appointment.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold text-gray-800 flex items-center gap-1">
                      <Clock size={16} />
                      {appointment.time}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      appointment.status
                    )}`}
                  >
                    {getStatusLabel(appointment.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Actions Rapides</h2>

          <div className="space-y-3">
            <Link
              href="/pro/appointments"
              className="block w-full p-4 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors text-center font-medium"
            >
              Gérer Rendez-vous
            </Link>
            <Link
              href="/pro/documents"
              className="block w-full p-4 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors text-center font-medium"
            >
              Uploader Documents
            </Link>
            <Link
              href="/pro/schedule"
              className="block w-full p-4 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-lg transition-colors text-center font-medium"
            >
              Gérer Horaires
            </Link>
            <Link
              href="/pro/profile"
              className="block w-full p-4 bg-yellow-50 hover:bg-yellow-100 text-yellow-600 rounded-lg transition-colors text-center font-medium"
            >
              Éditer Profil
            </Link>
            <Link
              href="/pro/reviews"
              className="block w-full p-4 bg-pink-50 hover:bg-pink-100 text-pink-600 rounded-lg transition-colors text-center font-medium"
            >
              Voir Avis
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <BarChart3 size={18} />
              Statistiques Rapides
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Taux de Remplissage</span>
                <span className="font-semibold text-gray-800">85%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>
              <div className="flex justify-between mt-4">
                <span className="text-gray-600">Patients Aujourd\'hui</span>
                <span className="font-semibold text-gray-800">8/10</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '80%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Activité Récente</h2>

        <div className="space-y-4">
          {[
            { action: 'Rendez-vous confirmé', patient: 'Mamadou Diallo', time: 'Il y a 2 heures' },
            { action: 'Document uploadé', patient: 'Aissatou Bah', time: 'Il y a 4 heures' },
            { action: 'Avis reçu', patient: '5 étoiles - Ibrahima Sow', time: 'Il y a 6 heures' },
            { action: 'Profil mis à jour', patient: 'Vous', time: 'Il y a 1 jour' },
          ].map((activity, index) => (
            <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <p className="font-medium text-gray-800">{activity.action}</p>
                <p className="text-sm text-gray-600">{activity.patient}</p>
              </div>
              <span className="text-xs text-gray-500">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
