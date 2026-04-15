'use client';

import { useState } from 'react';
import Link from 'next/link';
import { User, Mail, Phone, MapPin, Calendar, FileText, Heart, Clock, Settings, LogOut, Edit2 } from 'lucide-react';

export default function UserProfilePage() {
  const [activeTab, setActiveTab] = useState('info');

  // Mock user data
  const user = {
    id: '1',
    name: 'Mamadou Diallo',
    email: 'mamadou.diallo@email.com',
    phone: '+224 622 123 456',
    dateOfBirth: '1990-05-15',
    gender: 'Homme',
    location: 'Conakry, Guinée',
    bloodType: 'O+',
    allergies: 'Pénicilline',
    joinDate: '2023-06-15',
    avatar: '👨‍💼',
  };

  const appointments = [
    {
      id: 1,
      doctor: 'Dr. Ahmed Diallo',
      specialty: 'Cardiologue',
      date: '2024-04-20',
      time: '14:00',
      status: 'confirmed',
      location: 'Kindia, Conakry',
    },
    {
      id: 2,
      doctor: 'Dr. Fatou Sow',
      specialty: 'Généraliste',
      date: '2024-04-25',
      time: '10:00',
      status: 'pending',
      location: 'Plateau, Conakry',
    },
    {
      id: 3,
      doctor: 'Dr. Aïssatou Diop',
      specialty: 'Pédiatre',
      date: '2024-03-15',
      time: '16:00',
      status: 'completed',
      location: 'Ratoma, Conakry',
    },
  ];

  const medicalRecords = [
    {
      id: 1,
      type: 'Consultation',
      doctor: 'Dr. Ahmed Diallo',
      date: '2024-03-15',
      notes: 'Consultation générale - Tout va bien',
    },
    {
      id: 2,
      type: 'Analyse',
      doctor: 'Laboratoire Central',
      date: '2024-02-20',
      notes: 'Prise de sang - Résultats normaux',
    },
    {
      id: 3,
      type: 'Ordonnance',
      doctor: 'Dr. Fatou Sow',
      date: '2024-02-10',
      notes: 'Traitement pour grippe - 7 jours',
    },
  ];

  const favorites = [
    { id: 1, name: 'Dr. Ahmed Diallo', type: 'doctor', specialty: 'Cardiologue' },
    { id: 2, name: 'Pharmacie Centrale', type: 'pharmacy', location: 'Kindia' },
    { id: 3, name: 'Dr. Fatou Sow', type: 'doctor', specialty: 'Généraliste' },
  ];

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      confirmed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Confirmé' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'En attente' },
      completed: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Complété' },
    };
    const badge = badges[status] || badges.pending;
    return <span className={`px-3 py-1 rounded-full text-sm font-semibold ${badge.bg} ${badge.text}`}>{badge.label}</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/" className="text-blue-600 hover:text-blue-700 font-semibold mb-4 inline-block">
            ← Accueil
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-md p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-6">
              <div className="text-7xl">{user.avatar}</div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
                <p className="text-gray-600">Membre depuis {new Date(user.joinDate).toLocaleDateString('fr-FR')}</p>
                <div className="flex gap-2 mt-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">Patient</span>
                </div>
              </div>
            </div>
            <Link
              href="/profile/edit"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all"
            >
              <Edit2 size={20} />
              Modifier
            </Link>
          </div>

          {/* Quick Info */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Email</p>
              <p className="font-semibold text-gray-900 break-all">{user.email}</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Téléphone</p>
              <p className="font-semibold text-gray-900">{user.phone}</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Groupe Sanguin</p>
              <p className="font-semibold text-gray-900">{user.bloodType}</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Allergies</p>
              <p className="font-semibold text-gray-900">{user.allergies}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200">
            {[
              { id: 'info', label: 'Informations', icon: User },
              { id: 'appointments', label: 'Rendez-vous', icon: Clock },
              { id: 'medical', label: 'Dossier Médical', icon: FileText },
              { id: 'favorites', label: 'Favoris', icon: Heart },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-6 py-4 font-semibold flex items-center justify-center gap-2 transition-all ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon size={20} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {/* Info Tab */}
            {activeTab === 'info' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Nom Complet</label>
                    <input
                      type="text"
                      value={user.name}
                      disabled
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Date de Naissance</label>
                    <input
                      type="date"
                      value={user.dateOfBirth}
                      disabled
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Téléphone</label>
                    <input
                      type="tel"
                      value={user.phone}
                      disabled
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Sexe</label>
                    <input
                      type="text"
                      value={user.gender}
                      disabled
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Localisation</label>
                    <input
                      type="text"
                      value={user.location}
                      disabled
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Appointments Tab */}
            {activeTab === 'appointments' && (
              <div className="space-y-4">
                {appointments.map(apt => (
                  <div key={apt.id} className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-600 transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-gray-900">{apt.doctor}</h3>
                        <p className="text-sm text-gray-600">{apt.specialty}</p>
                      </div>
                      {getStatusBadge(apt.status)}
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400" />
                        <span>{apt.date} à {apt.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-gray-400" />
                        <span>{apt.location}</span>
                      </div>
                      <button className="text-blue-600 hover:text-blue-700 font-semibold">Voir Détails</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Medical Records Tab */}
            {activeTab === 'medical' && (
              <div className="space-y-4">
                {medicalRecords.map(record => (
                  <div key={record.id} className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-600 transition-all">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-gray-900">{record.type}</h3>
                        <p className="text-sm text-gray-600">{record.doctor}</p>
                      </div>
                      <span className="text-sm text-gray-500">{record.date}</span>
                    </div>
                    <p className="text-gray-600 text-sm">{record.notes}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Favorites Tab */}
            {activeTab === 'favorites' && (
              <div className="space-y-4">
                {favorites.map(fav => (
                  <div key={fav.id} className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-600 transition-all flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900">{fav.name}</h3>
                      <p className="text-sm text-gray-600">
                        {fav.type === 'doctor' ? fav.specialty : fav.location}
                      </p>
                    </div>
                    <button className="text-blue-600 hover:text-blue-700 font-semibold">Voir</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Settings Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <Link
            href="/profile/settings"
            className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition-all flex items-center gap-4"
          >
            <Settings className="w-8 h-8 text-blue-600" />
            <div>
              <h3 className="font-bold text-gray-900">Paramètres</h3>
              <p className="text-sm text-gray-600">Gérer vos préférences</p>
            </div>
          </Link>

          <button className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition-all flex items-center gap-4 text-left">
            <LogOut className="w-8 h-8 text-red-600" />
            <div>
              <h3 className="font-bold text-gray-900">Déconnexion</h3>
              <p className="text-sm text-gray-600">Quitter votre compte</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
