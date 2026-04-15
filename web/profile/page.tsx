'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Edit2, LogOut, Settings, Calendar, FileText, Heart, MessageSquare } from 'lucide-react';

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  type: 'patient' | 'doctor';
  avatar: string;
  joinDate: string;
  stats: {
    appointments: number;
    reviews: number;
    documents: number;
  };
}

const userProfile: UserProfile = {
  name: 'Jean Diallo',
  email: 'jean.diallo@email.com',
  phone: '+224 622 123 456',
  type: 'patient',
  avatar: '👤',
  joinDate: '2024-01-15',
  stats: {
    appointments: 12,
    reviews: 5,
    documents: 8,
  },
};

const menuItems = [
  { icon: Calendar, label: 'Mes rendez-vous', href: '/booking' },
  { icon: FileText, label: 'Dossier médical', href: '/medical-record' },
  { icon: MessageSquare, label: 'Messages', href: '/messages' },
  { icon: Heart, label: 'Favoris', href: '/favorites' },
  { icon: Settings, label: 'Paramètres', href: '/settings' },
];

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState(userProfile);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Link href="/" className="text-gray-600 hover:text-gray-900">
            ← Accueil
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Mon Profil</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="text-6xl">{profileData.avatar}</div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{profileData.name}</h2>
                  <p className="text-gray-600">{profileData.type === 'patient' ? 'Patient' : 'Médecin'}</p>
                  <p className="text-sm text-gray-600">Membre depuis {new Date(profileData.joinDate).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
              >
                <Edit2 size={18} />
                Modifier
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6 pt-6 border-t border-gray-200">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{profileData.stats.appointments}</p>
                <p className="text-sm text-gray-600">Rendez-vous</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{profileData.stats.reviews}</p>
                <p className="text-sm text-gray-600">Avis donnés</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{profileData.stats.documents}</p>
                <p className="text-sm text-gray-600">Documents</p>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-3 pt-6 border-t border-gray-200">
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium text-gray-900">{profileData.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Téléphone</p>
                <p className="font-medium text-gray-900">{profileData.phone}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="space-y-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition flex items-center gap-3"
              >
                <Icon size={20} className="text-blue-600" />
                <span className="font-medium text-gray-900">{item.label}</span>
                <span className="ml-auto text-gray-400">→</span>
              </Link>
            );
          })}
        </div>

        {/* Logout Button */}
        <button className="w-full mt-6 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium flex items-center justify-center gap-2">
          <LogOut size={20} />
          Déconnexion
        </button>
      </div>
    </div>
  );
}
