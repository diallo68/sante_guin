'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, MapPin, Star, Phone, Clock } from 'lucide-react';

interface Pharmacy {
  id: string;
  name: string;
  location: string;
  distance: number;
  rating: number;
  reviews: number;
  phone: string;
  hours: string;
  services: string[];
  open: boolean;
}

const pharmacies: Pharmacy[] = [
  {
    id: '1',
    name: 'Pharmacie Centrale',
    location: 'Plateau, Conakry',
    distance: 0.5,
    rating: 4.6,
    reviews: 98,
    phone: '+224 622 111 111',
    hours: '08:00 - 22:00',
    services: ['Livraison', 'Consultation'],
    open: true,
  },
  {
    id: '2',
    name: 'Pharmacie du Marché',
    location: 'Dixinn, Conakry',
    distance: 1.2,
    rating: 4.5,
    reviews: 76,
    phone: '+224 622 222 222',
    hours: '07:00 - 21:00',
    services: ['Livraison', 'Ordonnances'],
    open: true,
  },
  {
    id: '3',
    name: 'Pharmacie Santé Plus',
    location: 'Almamya, Conakry',
    distance: 2.1,
    rating: 4.8,
    reviews: 142,
    phone: '+224 622 333 333',
    hours: '08:00 - 20:00',
    services: ['Consultation', 'Livraison', 'Ordonnances'],
    open: true,
  },
  {
    id: '4',
    name: 'Pharmacie Kindia',
    location: 'Kindia, Conakry',
    distance: 3.5,
    rating: 4.4,
    reviews: 64,
    phone: '+224 622 444 444',
    hours: '09:00 - 19:00',
    services: ['Ordonnances'],
    open: false,
  },
];

export default function PharmaciesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'distance' | 'rating'>('distance');

  const filteredPharmacies = pharmacies
    .filter(pharmacy =>
      pharmacy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pharmacy.location.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'distance') return a.distance - b.distance;
      return b.rating - a.rating;
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
            <h1 className="text-2xl font-bold text-gray-900">Pharmacies</h1>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Chercher une pharmacie..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Sort */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setSortBy('distance')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              sortBy === 'distance'
                ? 'bg-green-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:border-green-600'
            }`}
          >
            📍 Plus proche
          </button>
          <button
            onClick={() => setSortBy('rating')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              sortBy === 'rating'
                ? 'bg-green-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:border-green-600'
            }`}
          >
            ⭐ Mieux notées
          </button>
        </div>

        {/* Pharmacies List */}
        <div className="space-y-4">
          {filteredPharmacies.map(pharmacy => (
            <div key={pharmacy.id} className="bg-white rounded-lg shadow hover:shadow-lg transition p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{pharmacy.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                    <MapPin size={16} />
                    {pharmacy.location}
                  </div>
                </div>
                <div className="text-right">
                  <div className="inline-block px-3 py-1 rounded-full text-sm font-semibold" style={{
                    backgroundColor: pharmacy.open ? '#dcfce7' : '#fee2e2',
                    color: pharmacy.open ? '#166534' : '#991b1b'
                  }}>
                    {pharmacy.open ? 'Ouvert' : 'Fermé'}
                  </div>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={i < Math.floor(pharmacy.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                    />
                  ))}
                </div>
                <span className="text-sm font-semibold text-gray-900">{pharmacy.rating}</span>
                <span className="text-sm text-gray-600">({pharmacy.reviews})</span>
              </div>

              {/* Info */}
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock size={16} />
                  {pharmacy.hours}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin size={16} />
                  {pharmacy.distance} km
                </div>
              </div>

              {/* Services */}
              <div className="flex flex-wrap gap-2 mb-4">
                {pharmacy.services.map(service => (
                  <span key={service} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                    {service}
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <a
                  href={`tel:${pharmacy.phone}`}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition font-medium text-center text-sm flex items-center justify-center gap-2"
                >
                  <Phone size={18} />
                  Appeler
                </a>
                <button className="flex-1 border border-green-600 text-green-600 py-2 rounded-lg hover:bg-green-50 transition font-medium">
                  Envoyer ordonnance
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredPharmacies.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">Aucune pharmacie trouvée</p>
          </div>
        )}
      </div>
    </div>
  );
}
