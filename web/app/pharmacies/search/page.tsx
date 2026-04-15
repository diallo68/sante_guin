'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, MapPin, Clock, Package, ChevronDown, Truck } from 'lucide-react';

export default function PharmaciesSearchPage() {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    maxDistance: 10,
    minRating: 4,
    service: '',
    status: 'all',
    delivery: 'all',
    openingHours: 'all',
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Redirection vers la page de résultats avec les filtres
    const params = new URLSearchParams();
    Object.entries(formData).forEach(([key, value]) => {
      if (value) {
        params.append(key, String(value));
      }
    });
    window.location.href = `/pharmacies?${params.toString()}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/" className="text-green-600 hover:text-green-700 font-semibold mb-4 inline-block">
            ← Retour
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Recherche Avancée</h1>
          <p className="text-gray-600">Trouvez la pharmacie qui vous convient</p>
        </div>
      </div>

      {/* Search Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nom de la pharmacie
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Pharmacie Centrale..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Localisation
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Conakry, Kindia..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                />
              </div>
            </div>

            {/* Distance */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Distance maximale : <span className="text-green-600">{formData.maxDistance} km</span>
              </label>
              <input
                type="range"
                name="maxDistance"
                min="1"
                max="50"
                value={formData.maxDistance}
                onChange={handleChange}
                className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-green-600"
              />
            </div>

            {/* Service */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Package className="w-4 h-4 inline mr-2" />
                Service
              </label>
              <select
                name="service"
                value={formData.service}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
              >
                <option value="">Tous les services</option>
                <option value="delivery">Livraison</option>
                <option value="consultation">Consultation</option>
                <option value="test">Test rapide</option>
                <option value="vaccination">Vaccination</option>
              </select>
            </div>

            {/* Advanced Filters Toggle */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-green-600 hover:text-green-700 font-semibold"
            >
              <ChevronDown className={`w-5 h-5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
              Filtres Avancés
            </button>

            {/* Advanced Filters */}
            {showAdvanced && (
              <div className="border-t border-gray-200 pt-6 space-y-6">
                {/* Rating */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Note minimale : <span className="text-green-600">{formData.minRating} ⭐</span>
                  </label>
                  <input
                    type="range"
                    name="minRating"
                    min="1"
                    max="5"
                    step="0.5"
                    value={formData.minRating}
                    onChange={handleChange}
                    className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-green-600"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-2" />
                    Statut
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                  >
                    <option value="all">Tous</option>
                    <option value="open">Ouvertes maintenant</option>
                    <option value="24h">Ouvertes 24h/24</option>
                  </select>
                </div>

                {/* Delivery */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Truck className="w-4 h-4 inline mr-2" />
                    Livraison
                  </label>
                  <select
                    name="delivery"
                    value={formData.delivery}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                  >
                    <option value="all">Tous</option>
                    <option value="available">Avec livraison</option>
                    <option value="fast">Livraison rapide (&lt;1h)</option>
                  </select>
                </div>

                {/* Opening Hours */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-2" />
                    Horaires
                  </label>
                  <select
                    name="openingHours"
                    value={formData.openingHours}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                  >
                    <option value="all">Tous les horaires</option>
                    <option value="morning">Matin (6h-12h)</option>
                    <option value="afternoon">Après-midi (12h-18h)</option>
                    <option value="evening">Soir (18h-00h)</option>
                    <option value="night">Nuit (00h-6h)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                type="submit"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-all"
              >
                <Search className="w-5 h-5 inline mr-2" />
                Rechercher
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    name: '',
                    location: '',
                    maxDistance: 10,
                    minRating: 4,
                    service: '',
                    status: 'all',
                    delivery: 'all',
                    openingHours: 'all',
                  });
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold py-3 px-4 rounded-lg transition-all"
              >
                Réinitialiser
              </button>
            </div>
          </form>

          {/* Tips */}
          <div className="mt-8 p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 className="font-bold text-gray-900 mb-2">💡 Conseils de Recherche</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Recherchez par nom ou localisation pour des résultats rapides</li>
              <li>• Utilisez la distance pour trouver les pharmacies les plus proches</li>
              <li>• Filtrez par service pour vos besoins spécifiques</li>
              <li>• Vérifiez la disponibilité de la livraison</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Recherches Populaires</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: 'Pharmacies ouvertes maintenant', status: 'open' },
            { name: 'Pharmacies avec livraison', delivery: 'available' },
            { name: 'Pharmacies 24h/24', status: '24h' },
            { name: 'Pharmacies à Conakry', location: 'Conakry' },
          ].map((search, index) => (
            <button
              key={index}
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  ...search,
                }));
              }}
              className="bg-white hover:bg-green-50 border-2 border-gray-200 hover:border-green-600 rounded-lg p-4 text-left transition-all"
            >
              <p className="font-semibold text-gray-900">{search.name}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
