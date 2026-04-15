'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, MapPin, Star, Filter, X, ChevronDown, Clock, Users } from 'lucide-react';

// Types
interface Doctor {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  reviews: number;
  distance: number;
  location: string;
  image: string;
  available: boolean;
  nextAvailable: string;
  experience: number;
  languages: string[];
  consultationFee: number;
  consultationType: 'online' | 'physical' | 'both';
}

// Mock Data
const DOCTORS: Doctor[] = [
  {
    id: '1',
    name: 'Dr. Ahmed Diallo',
    specialty: 'Cardiologue',
    rating: 4.8,
    reviews: 127,
    distance: 2.3,
    location: 'Kindia, Conakry',
    image: '👨‍⚕️',
    available: true,
    nextAvailable: 'Aujourd\'hui 14:00',
    experience: 12,
    languages: ['Français', 'Anglais'],
    consultationFee: 50000,
    consultationType: 'both',
  },
  {
    id: '2',
    name: 'Dr. Fatou Sow',
    specialty: 'Généraliste',
    rating: 4.6,
    reviews: 89,
    distance: 1.5,
    location: 'Plateau, Conakry',
    image: '👩‍⚕️',
    available: true,
    nextAvailable: 'Demain 10:00',
    experience: 8,
    languages: ['Français'],
    consultationFee: 35000,
    consultationType: 'physical',
  },
  {
    id: '3',
    name: 'Dr. Mamadou Bah',
    specialty: 'Dermatologue',
    rating: 4.7,
    reviews: 156,
    distance: 3.2,
    location: 'Dixinn, Conakry',
    image: '👨‍⚕️',
    available: false,
    nextAvailable: 'Samedi 09:00',
    experience: 15,
    languages: ['Français', 'Anglais', 'Arabe'],
    consultationFee: 45000,
    consultationType: 'both',
  },
  {
    id: '4',
    name: 'Dr. Aïssatou Diop',
    specialty: 'Pédiatre',
    rating: 4.9,
    reviews: 203,
    distance: 2.8,
    location: 'Ratoma, Conakry',
    image: '👩‍⚕️',
    available: true,
    nextAvailable: 'Aujourd\'hui 16:00',
    experience: 10,
    languages: ['Français', 'Anglais'],
    consultationFee: 40000,
    consultationType: 'both',
  },
  {
    id: '5',
    name: 'Dr. Ibrahim Kone',
    specialty: 'Orthopédiste',
    rating: 4.5,
    reviews: 72,
    distance: 4.1,
    location: 'Matam, Conakry',
    image: '👨‍⚕️',
    available: true,
    nextAvailable: 'Demain 14:00',
    experience: 20,
    languages: ['Français'],
    consultationFee: 55000,
    consultationType: 'physical',
  },
];

const SPECIALTIES = [
  'Tous',
  'Cardiologue',
  'Généraliste',
  'Dermatologue',
  'Pédiatre',
  'Orthopédiste',
  'Ophtalmologue',
  'ORL',
  'Neurologie',
];

export default function DoctorsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('Tous');
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'availability'>('distance');
  const [showFilters, setShowFilters] = useState(false);
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available'>('all');
  const [consultationTypeFilter, setConsultationTypeFilter] = useState<'all' | 'online' | 'physical'>('all');

  // Filtrer et trier les médecins
  const filteredDoctors = useMemo(() => {
    let result = DOCTORS;

    // Filtre par recherche
    if (searchQuery) {
      result = result.filter(doctor =>
        doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtre par spécialité
    if (selectedSpecialty !== 'Tous') {
      result = result.filter(doctor => doctor.specialty === selectedSpecialty);
    }

    // Filtre par disponibilité
    if (availabilityFilter === 'available') {
      result = result.filter(doctor => doctor.available);
    }

    // Filtre par type de consultation
    if (consultationTypeFilter !== 'all') {
      result = result.filter(doctor => {
        if (consultationTypeFilter === 'online') {
          return doctor.consultationType === 'online' || doctor.consultationType === 'both';
        }
        if (consultationTypeFilter === 'physical') {
          return doctor.consultationType === 'physical' || doctor.consultationType === 'both';
        }
        return true;
      });
    }

    // Tri
    return result.sort((a, b) => {
      if (sortBy === 'distance') {
        return a.distance - b.distance;
      }
      if (sortBy === 'rating') {
        return b.rating - a.rating;
      }
      if (sortBy === 'availability') {
        return a.available === b.available ? 0 : a.available ? -1 : 1;
      }
      return 0;
    });
  }, [searchQuery, selectedSpecialty, sortBy, availabilityFilter, consultationTypeFilter]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Médecins</h1>
            <Link
              href="/"
              className="text-gray-600 hover:text-gray-900 font-semibold"
            >
              ← Accueil
            </Link>
          </div>

          {/* Search Bar */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un médecin ou une spécialité..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold flex items-center gap-2 transition-all"
            >
              <Filter size={20} />
              Filtres
            </button>
          </div>
        </div>

        {/* Specialty Tabs */}
        <div className="border-t border-gray-200 overflow-x-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-2 py-3">
            {SPECIALTIES.map(specialty => (
              <button
                key={specialty}
                onClick={() => setSelectedSpecialty(specialty)}
                className={`px-4 py-2 rounded-full whitespace-nowrap font-semibold transition-all ${
                  selectedSpecialty === specialty
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {specialty}
              </button>
            ))}
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="border-t border-gray-200 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Sort */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Trier par</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                  >
                    <option value="distance">Distance</option>
                    <option value="rating">Note</option>
                    <option value="availability">Disponibilité</option>
                  </select>
                </div>

                {/* Availability */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Disponibilité</label>
                  <select
                    value={availabilityFilter}
                    onChange={(e) => setAvailabilityFilter(e.target.value as any)}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                  >
                    <option value="all">Tous</option>
                    <option value="available">Disponibles maintenant</option>
                  </select>
                </div>

                {/* Consultation Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Type de consultation</label>
                  <select
                    value={consultationTypeFilter}
                    onChange={(e) => setConsultationTypeFilter(e.target.value as any)}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                  >
                    <option value="all">Tous</option>
                    <option value="online">En ligne</option>
                    <option value="physical">Physique</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            <span className="font-bold text-gray-900">{filteredDoctors.length}</span> médecin{filteredDoctors.length > 1 ? 's' : ''} trouvé{filteredDoctors.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* Doctor Cards Grid */}
        {filteredDoctors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDoctors.map(doctor => (
              <Link
                key={doctor.id}
                href={`/doctors/${doctor.id}`}
                className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all overflow-hidden border border-gray-200 hover:border-blue-600"
              >
                {/* Card Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="text-5xl">{doctor.image}</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{doctor.name}</h3>
                      <p className="text-sm text-blue-600 font-semibold mb-2">{doctor.specialty}</p>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-bold text-gray-900">{doctor.rating}</span>
                        <span className="text-sm text-gray-600">({doctor.reviews})</span>
                      </div>
                    </div>
                  </div>

                  {/* Availability Badge */}
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                    doctor.available
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {doctor.available ? '✓ Disponible' : 'Non disponible'}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6 space-y-3">
                  {/* Location */}
                  <div className="flex items-start gap-2">
                    <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">{doctor.location}</p>
                      <p className="text-xs text-gray-500">{doctor.distance} km</p>
                    </div>
                  </div>

                  {/* Next Available */}
                  <div className="flex items-start gap-2">
                    <Clock className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-600">{doctor.nextAvailable}</p>
                  </div>

                  {/* Experience */}
                  <div className="flex items-start gap-2">
                    <Users className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-600">{doctor.experience} ans d'expérience</p>
                  </div>

                  {/* Languages */}
                  <div className="flex flex-wrap gap-2">
                    {doctor.languages.map(lang => (
                      <span key={lang} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {lang}
                      </span>
                    ))}
                  </div>

                  {/* Consultation Fee */}
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      Consultation à partir de <span className="font-bold text-gray-900">{doctor.consultationFee.toLocaleString()} FG</span>
                    </p>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="p-6 bg-gray-50 border-t border-gray-200">
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all">
                    Voir le Profil
                  </button>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg mb-4">Aucun médecin trouvé</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedSpecialty('Tous');
                setAvailabilityFilter('all');
                setConsultationTypeFilter('all');
              }}
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
