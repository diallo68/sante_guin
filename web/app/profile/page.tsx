'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User, Mail, Phone, MapPin, Calendar, Clock,
  Heart, Settings, LogOut, Loader2, AlertCircle, Stethoscope, Pill,
} from 'lucide-react';

interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  role: string;
  isVerified: boolean;
}

interface Doctor {
  _id: string;
  firstName: string;
  lastName: string;
  specialty: string;
  city: string;
  rating: number;
  reviewCount: number;
  isAvailable: boolean;
}

interface FavPharmacy {
  _id: string;
  name: string;
  city: string;
  rating: number;
  reviewCount: number;
  isOpen24h: boolean;
  openTime?: string;
  closeTime?: string;
}

interface Appointment {
  _id: string;
  doctorId: Doctor;
  date: string;
  time: string;
  reason?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
}

const STATUS_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  confirmed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Confirmé' },
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'En attente' },
  completed: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Complété' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Annulé' },
};

export default function UserProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('info');
  const [user, setUser] = useState<UserData | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [favDoctors, setFavDoctors] = useState<Doctor[]>([]);
  const [favPharmacies, setFavPharmacies] = useState<FavPharmacy[]>([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingApts, setLoadingApts] = useState(false);
  const [loadingFavs, setLoadingFavs] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => {
        if (r.status === 401) {
          router.push('/auth/login');
          return null;
        }
        return r.json();
      })
      .then(data => {
        if (data?.user) setUser(data.user);
        else if (data?.error) setError(data.error);
      })
      .catch(() => setError('Erreur réseau'))
      .finally(() => setLoadingUser(false));
  }, [router]);

  useEffect(() => {
    if (activeTab !== 'appointments' || !user) return;
    setLoadingApts(true);
    fetch('/api/appointments')
      .then(r => r.json())
      .then(data => { if (data.appointments) setAppointments(data.appointments); })
      .catch(() => {})
      .finally(() => setLoadingApts(false));
  }, [activeTab, user]);

  useEffect(() => {
    if (activeTab !== 'favorites' || !user) return;
    setLoadingFavs(true);
    fetch('/api/favorites')
      .then(r => r.json())
      .then(data => {
        if (data.doctors) setFavDoctors(data.doctors);
        if (data.pharmacies) setFavPharmacies(data.pharmacies);
      })
      .catch(() => {})
      .finally(() => setLoadingFavs(false));
  }, [activeTab, user]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-12 h-12 text-gray-400" />
        <p className="text-gray-600">{error || 'Vous devez être connecté pour accéder à cette page'}</p>
        <Link href="/auth/login" className="text-blue-600 hover:underline">Se connecter</Link>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const badge = STATUS_BADGES[status] || STATUS_BADGES.pending;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-md p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="text-blue-600" size={40} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {user.firstName} {user.lastName}
                </h1>
                <div className="flex gap-2 mt-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold capitalize">
                    {user.role === 'patient' ? 'Patient' : user.role}
                  </span>
                  {user.isVerified && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                      ✓ Vérifié
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {user.email && (
              <div className="p-4 bg-blue-50 rounded-lg flex items-center gap-3">
                <Mail className="text-blue-600" size={20} />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-semibold text-gray-900">{user.email}</p>
                </div>
              </div>
            )}
            {user.phone && (
              <div className="p-4 bg-blue-50 rounded-lg flex items-center gap-3">
                <Phone className="text-blue-600" size={20} />
                <div>
                  <p className="text-sm text-gray-600">Téléphone</p>
                  <p className="font-semibold text-gray-900">{user.phone}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="flex border-b border-gray-200">
            {[
              { id: 'info', label: 'Informations', icon: User },
              { id: 'appointments', label: 'Rendez-vous', icon: Clock },
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

          <div className="p-8">
            {activeTab === 'info' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Prénom</label>
                    <div className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-800">
                      {user.firstName}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Nom</label>
                    <div className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-800">
                      {user.lastName}
                    </div>
                  </div>
                  {user.email && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                      <div className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-800">
                        {user.email}
                      </div>
                    </div>
                  )}
                  {user.phone && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Téléphone</label>
                      <div className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-800">
                        {user.phone}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'appointments' && (
              <div className="space-y-4">
                {loadingApts ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  </div>
                ) : appointments.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">Aucun rendez-vous</p>
                    <Link href="/doctors" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
                      Trouver un médecin →
                    </Link>
                  </div>
                ) : (
                  appointments.map(apt => (
                    <div key={apt._id} className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-gray-900">
                            Dr. {apt.doctorId.firstName} {apt.doctorId.lastName}
                          </h3>
                          <p className="text-sm text-gray-600">{apt.doctorId.specialty}</p>
                        </div>
                        {getStatusBadge(apt.status)}
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-gray-400" />
                          <span>{new Date(apt.date).toLocaleDateString('fr-FR')} à {apt.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin size={16} className="text-gray-400" />
                          <span>{apt.doctorId.city}</span>
                        </div>
                        {apt.reason && (
                          <div className="flex items-center gap-2">
                            <Heart size={16} className="text-gray-400" />
                            <span>{apt.reason}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'favorites' && (
              <div>
                {loadingFavs ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  </div>
                ) : favDoctors.length === 0 && favPharmacies.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">Aucun favori</p>
                    <p className="text-sm text-gray-400 mt-1">Cliquez sur le cœur ❤️ sur la fiche d'un médecin ou d'une pharmacie pour l'ajouter ici.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {favDoctors.length > 0 && (
                      <div>
                        <h3 className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
                          <Stethoscope size={14} /> Médecins
                        </h3>
                        <div className="space-y-3">
                          {favDoctors.map(doc => (
                            <Link key={doc._id} href={`/doctors/${doc._id}`}
                              className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 transition-all">
                              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">👨‍⚕️</div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-gray-900">Dr. {doc.firstName} {doc.lastName}</p>
                                <p className="text-sm text-blue-600 font-semibold">{doc.specialty}</p>
                                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><MapPin size={10} />{doc.city}</p>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-bold ${doc.isAvailable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                {doc.isAvailable ? 'Disponible' : 'Indisponible'}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                    {favPharmacies.length > 0 && (
                      <div>
                        <h3 className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
                          <Pill size={14} /> Pharmacies
                        </h3>
                        <div className="space-y-3">
                          {favPharmacies.map(ph => (
                            <Link key={ph._id} href={`/pharmacies/${ph._id}`}
                              className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-emerald-300 transition-all">
                              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">💊</div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-gray-900">{ph.name}</p>
                                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><MapPin size={10} />{ph.city}</p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {ph.isOpen24h ? '24h/24' : `${ph.openTime} – ${ph.closeTime}`}
                                </p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
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

          <button
            onClick={handleLogout}
            className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition-all flex items-center gap-4 text-left"
          >
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
