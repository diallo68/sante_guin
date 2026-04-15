'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, MapPin, Clock, DollarSign, Globe, ChevronDown } from 'lucide-react';

export default function DoctorsSearchPage() {
  const [formData, setFormData] = useState({
    specialty: '',
    location: '',
    maxDistance: 10,
    minRating: 4,
    maxPrice: 100000,
    consultationType: 'all',
    language: '',
    availability: 'all',
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
    window.location.href = `/doctors?${params.toString()}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/" className="text-blue-600 hover:text-blue-700 font-semibold mb-4 inline-block">
            ← Retour
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Recherche Avancée</h1>
          <p className="text-gray-600">Trouvez le médecin parfait selon vos critères</p>
        </div>
      </div>

      {/* Search Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Specialty */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Spécialité
                </label>
                <select
                  name="specialty"
                  value={formData.specialty}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                >
                  <option value="">Toutes les spécialités</option>
                  <option value="cardiologue">Cardiologue</option>
                  <option value="generaliste">Généraliste</option>
                  <option value="dermatologue">Dermatologue</option>
                  <option value="pediatre">Pédiatre</option>
                  <option value="orthopediste">Orthopédiste</option>
                  <option value="ophtalmologue">Ophtalmologue</option>
                  <option value="orl">ORL</option>
                  <option value="neurologie">Neurologie</option>
                </select>
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
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            {/* Distance */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Distance maximale : <span className="text-blue-600">{formData.maxDistance} km</span>
              </label>
              <input
                type="range"
                name="maxDistance"
                min="1"
                max="50"
                value={formData.maxDistance}
                onChange={handleChange}
                className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            {/* Advanced Filters Toggle */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
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
                    Note minimale : <span className="text-blue-600">{formData.minRating} ⭐</span>
                  </label>
                  <input
                    type="range"
                    name="minRating"
                    min="1"
                    max="5"
                    step="0.5"
                    value={formData.minRating}
                    onChange={handleChange}
                    className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>

                {/* Max Price */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    <DollarSign className="w-4 h-4 inline mr-2" />
                    Prix maximum : <span className="text-blue-600">{formData.maxPrice.toLocaleString()} FG</span>
                  </label>
                  <input
                    type="range"
                    name="maxPrice"
                    min="10000"
                    max="200000"
                    step="5000"
                    value={formData.maxPrice}
                    onChange={handleChange}
                    className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>

                {/* Consultation Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Type de consultation
                  </label>
                  <select
                    name="consultationType"
                    value={formData.consultationType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                  >
                    <option value="all">Tous</option>
                    <option value="online">En ligne</option>
                    <option value="physical">Physique</option>
                    <option value="both">Les deux</option>
                  </select>
                </div>

                {/* Language */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Globe className="w-4 h-4 inline mr-2" />
                    Langue
                  </label>
                  <select
                    name="language"
                    value={formData.language}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                  >
                    <option value="">Toutes les langues</option>
                    <option value="french">Français</option>
                    <option value="english">Anglais</option>
                    <option value="arabic">Arabe</option>
                  </select>
                </div>

                {/* Availability */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-2" />
                    Disponibilité
                  </label>
                  <select
                    name="availability"
                    value={formData.availability}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                  >
                    <option value="all">Tous</option>
                    <option value="today">Aujourd'hui</option>
                    <option value="tomorrow">Demain</option>
                    <option value="week">Cette semaine</option>
                  </select>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all"
              >
                <Search className="w-5 h-5 inline mr-2" />
                Rechercher
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    specialty: '',
                    location: '',
                    maxDistance: 10,
                    minRating: 4,
                    maxPrice: 100000,
                    consultationType: 'all',
                    language: '',
                    availability: 'all',
                  });
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold py-3 px-4 rounded-lg transition-all"
              >
                Réinitialiser
              </button>
            </div>
          </form>

          {/* Tips */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-bold text-gray-900 mb-2">💡 Conseils de Recherche</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Utilisez des mots-clés spécifiques pour de meilleurs résultats</li>
              <li>• Ajustez la distance pour trouver des médecins près de vous</li>
              <li>• Filtrez par note pour trouver les meilleurs médecins</li>
              <li>• Sélectionnez le type de consultation qui vous convient</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Recherches Populaires</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: 'Cardiologue à Conakry', specialty: 'cardiologue', location: 'Conakry' },
            { name: 'Pédiatre disponible aujourd\'hui', specialty: 'pediatre', availability: 'today' },
            { name: 'Dermatologue moins de 5 km', specialty: 'dermatologue', maxDistance: 5 },
            { name: 'Consultation en ligne', specialty: '', consultationType: 'online' },
          ].map((search, index) => (
            <button
              key={index}
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  ...search,
                }));
              }}
              className="bg-white hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-600 rounded-lg p-4 text-left transition-all"
            >
              <p className="font-semibold text-gray-900">{search.name}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
