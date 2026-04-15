'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, MapPin, Star, Filter, Clock, Phone, Package } from 'lucide-react';

// Types
interface Pharmacy {
  id: string;
  name: string;
  rating: number;
  reviews: number;
  distance: number;
  location: string;
  image: string;
  isOpen: boolean;
  openingHours: string;
  phone: string;
  experience: number;
  services: string[];
  deliveryAvailable: boolean;
  deliveryTime: string;
}

// Mock Data
const PHARMACIES: Pharmacy[] = [
  {
    id: '1',
    name: 'Pharmacie Centrale',
    rating: 4.7,
    reviews: 145,
    distance: 1.2,
    location: 'Kindia, Conakry',
    image: '💊',
    isOpen: true,
    openingHours: '08:00 - 22:00',
    phone: '+224 622 123 456',
    experience: 15,
    services: ['Livraison', 'Consultation', 'Test rapide'],
    deliveryAvailable: true,
    deliveryTime: '30-45 min',
  },
  {
    id: '2',
    name: 'Pharmacie du Plateau',
    rating: 4.5,
    reviews: 98,
    distance: 2.1,
    location: 'Plateau, Conakry',
    image: '💊',
    isOpen: true,
    openingHours: '07:00 - 23:00',
    phone: '+224 622 234 567',
    experience: 12,
    services: ['Livraison', 'Consultation'],
    deliveryAvailable: true,
    deliveryTime: '45-60 min',
  },
  {
    id: '3',
    name: 'Pharmacie Santé Plus',
    rating: 4.8,
    reviews: 203,
    distance: 3.5,
    location: 'Dixinn, Conakry',
    image: '💊',
    isOpen: false,
    openingHours: '09:00 - 20:00',
    phone: '+224 622 345 678',
    experience: 20,
    services: ['Livraison', 'Consultation', 'Test rapide', 'Vaccination'],
    deliveryAvailable: true,
    deliveryTime: '20-30 min',
  },
  {
    id: '4',
    name: 'Pharmacie Ratoma',
    rating: 4.6,
    reviews: 112,
    distance: 2.8,
    location: 'Ratoma, Conakry',
    image: '💊',
    isOpen: true,
    openingHours: '08:00 - 21:00',
    phone: '+224 622 456 789',
    experience: 10,
    services: ['Livraison', 'Consultation'],
    deliveryAvailable: false,
    deliveryTime: '-',
  },
  {
    id: '5',
    name: 'Pharmacie Matam Express',
    rating: 4.4,
    reviews: 67,
    distance: 4.2,
    location: 'Matam, Conakry',
    image: '💊',
    isOpen: true,
    openingHours: '07:00 - 22:00',
    phone: '+224 622 567 890',
    experience: 8,
    services: ['Livraison', 'Test rapide'],
    deliveryAvailable: true,
    deliveryTime: '60-90 min',
  },
];

const SERVICES = [
  'Tous',
  'Livraison',
  'Consultation',
  'Test rapide',
  'Vaccination',
];

export default function PharmaciesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState('Tous');
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'openness'>('distance');
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'open'>('all');
  const [deliveryFilter, setDeliveryFilter] = useState<'all' | 'delivery'>('all');

  // Filtrer et trier les pharmacies
  const filteredPharmacies = useMemo(() => {
    let result = PHARMACIES;

    // Filtre par recherche
    if (searchQuery) {
      result = result.filter(pharmacy =>
        pharmacy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pharmacy.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtre par service
    if (selectedService !== 'Tous') {
      result = result.filter(pharmacy =>
        pharmacy.services.includes(selectedService)
      );
    }

    // Filtre par statut
    if (statusFilter === 'open') {
      result = result.filter(pharmacy => pharmacy.isOpen);
    }

    // Filtre par livraison
    if (deliveryFilter === 'delivery') {
      result = result.filter(pharmacy => pharmacy.deliveryAvailable);
    }

    // Tri
    return result.sort((a, b) => {
      if (sortBy === 'distance') {
        return a.distance - b.distance;
      }
      if (sortBy === 'rating') {
        return b.rating - a.rating;
      }
      if (sortBy === 'openness') {
        return a.isOpen === b.isOpen ? 0 : a.isOpen ? -1 : 1;
      }
      return 0;
    });
  }, [searchQuery, selectedService, sortBy, statusFilter, deliveryFilter]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Pharmacies</h1>
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
                placeholder="Rechercher une pharmacie..."
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

        {/* Service Tabs */}
        <div className="border-t border-gray-200 overflow-x-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-2 py-3">
            {SERVICES.map(service => (
              <button
                key={service}
                onClick={() => setSelectedService(service)}
                className={`px-4 py-2 rounded-full whitespace-nowrap font-semibold transition-all ${
                  selectedService === service
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {service}
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
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                  >
                    <option value="distance">Distance</option>
                    <option value="rating">Note</option>
                    <option value="openness">Ouvertes en premier</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Statut</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                  >
                    <option value="all">Tous</option>
                    <option value="open">Ouvertes maintenant</option>
                  </select>
                </div>

                {/* Delivery */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Livraison</label>
                  <select
                    value={deliveryFilter}
                    onChange={(e) => setDeliveryFilter(e.target.value as any)}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                  >
                    <option value="all">Tous</option>
                    <option value="delivery">Avec livraison</option>
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
            <span className="font-bold text-gray-900">{filteredPharmacies.length}</span> pharmacie{filteredPharmacies.length > 1 ? 's' : ''} trouvée{filteredPharmacies.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* Pharmacy Cards Grid */}
        {filteredPharmacies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPharmacies.map(pharmacy => (
              <Link
                key={pharmacy.id}
                href={`/pharmacies/${pharmacy.id}`}
                className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all overflow-hidden border border-gray-200 hover:border-green-600"
              >
                {/* Card Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="text-5xl">{pharmacy.image}</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{pharmacy.name}</h3>
                      <div className="flex items-center gap-1 mb-2">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-bold text-gray-900">{pharmacy.rating}</span>
                        <span className="text-sm text-gray-600">({pharmacy.reviews})</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                    pharmacy.isOpen
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {pharmacy.isOpen ? '✓ Ouvert' : 'Fermé'}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6 space-y-3">
                  {/* Location */}
                  <div className="flex items-start gap-2">
                    <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">{pharmacy.location}</p>
                      <p className="text-xs text-gray-500">{pharmacy.distance} km</p>
                    </div>
                  </div>

                  {/* Hours */}
                  <div className="flex items-start gap-2">
                    <Clock className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-600">{pharmacy.openingHours}</p>
                  </div>

                  {/* Phone */}
                  <div className="flex items-start gap-2">
                    <Phone className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-600">{pharmacy.phone}</p>
                  </div>

                  {/* Services */}
                  <div className="flex flex-wrap gap-2">
                    {pharmacy.services.slice(0, 2).map(service => (
                      <span key={service} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        {service}
                      </span>
                    ))}
                    {pharmacy.services.length > 2 && (
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        +{pharmacy.services.length - 2}
                      </span>
                    )}
                  </div>

                  {/* Delivery */}
                  {pharmacy.deliveryAvailable && (
                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex items-center gap-2">
                        <Package className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-semibold text-gray-900">
                          Livraison en {pharmacy.deliveryTime}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="p-6 bg-gray-50 border-t border-gray-200">
                  <button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-all">
                    Voir le Profil
                  </button>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg mb-4">Aucune pharmacie trouvée</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedService('Tous');
                setStatusFilter('all');
                setDeliveryFilter('all');
              }}
              className="text-green-600 hover:text-green-700 font-semibold"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
