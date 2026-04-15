'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, MapPin, Star, Phone, MessageCircle } from 'lucide-react';

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  location: string;
  rating: number;
  reviews: number;
  phone: string;
  avatar: string;
  available: boolean;
}

const doctors: Doctor[] = [
  {
    id: '1',
    name: 'Dr. Ahmed Diallo',
    specialty: 'Cardiologue',
    location: 'Kindia, Conakry',
    rating: 4.8,
    reviews: 124,
    phone: '+224 622 123 456',
    avatar: '👨‍⚕️',
    available: true,
  },
  {
    id: '2',
    name: 'Dr. Fatou Sow',
    specialty: 'Généraliste',
    location: 'Plateau, Conakry',
    rating: 4.6,
    reviews: 89,
    phone: '+224 622 234 567',
    avatar: '👩‍⚕️',
    available: true,
  },
  {
    id: '3',
    name: 'Dr. Mamadou Camara',
    specialty: 'Chirurgien',
    location: 'Almamya, Conakry',
    rating: 4.9,
    reviews: 156,
    phone: '+224 622 345 678',
    avatar: '👨‍⚕️',
    available: false,
  },
  {
    id: '4',
    name: 'Dr. Aïssatou Ba',
    specialty: 'Gynécologue',
    location: 'Dixinn, Conakry',
    rating: 4.7,
    reviews: 102,
    phone: '+224 622 456 789',
    avatar: '👩‍⚕️',
    available: true,
  },
];

const specialties = [
  'Tous',
  'Généraliste',
  'Cardiologue',
  'Chirurgien',
  'Gynécologue',
  'Dermatologue',
  'Pédiatre',
];

export default function DoctorsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('Tous');

  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialty = selectedSpecialty === 'Tous' || doctor.specialty === selectedSpecialty;
    return matchesSearch && matchesSpecialty;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/" className="text-gray-600 hover:text-gray-900">
              ← Accueil
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Médecins</h1>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Chercher un médecin..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Specialty Filter */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Spécialité</h2>
          <div className="flex flex-wrap gap-2">
            {specialties.map(specialty => (
              <button
                key={specialty}
                onClick={() => setSelectedSpecialty(specialty)}
                className={`px-4 py-2 rounded-full font-medium transition ${
                  selectedSpecialty === specialty
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:border-blue-600'
                }`}
              >
                {specialty}
              </button>
            ))}
          </div>
        </div>

        {/* Doctors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map(doctor => (
            <div key={doctor.id} className="bg-white rounded-lg shadow hover:shadow-lg transition">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">{doctor.avatar}</div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{doctor.name}</h3>
                      <p className="text-sm text-gray-600">{doctor.specialty}</p>
                    </div>
                  </div>
                  {doctor.available && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                      Disponible
                    </span>
                  )}
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className={i < Math.floor(doctor.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{doctor.rating}</span>
                  <span className="text-sm text-gray-600">({doctor.reviews})</span>
                </div>

                {/* Location */}
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                  <MapPin size={16} />
                  {doctor.location}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link
                    href={`/doctors/${doctor.id}`}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium text-center text-sm"
                  >
                    Voir le profil
                  </Link>
                  <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                    <MessageCircle size={18} className="text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredDoctors.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">Aucun médecin trouvé</p>
          </div>
        )}
      </div>
    </div>
  );
}
