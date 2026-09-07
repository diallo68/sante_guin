'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, MapPin, Star, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

interface Doctor {
  _id: string;
  firstName: string;
  lastName: string;
  specialty: string;
  rating: number;
  reviewCount: number;
  city: string;
  address?: string;
  photo?: string;
  isAvailable: boolean;
  consultationFee?: number;
  languages: string[];
  bio?: string;
}

const SPECIALTIES = [
  'Tous',
  'Cardiologue',
  'Médecin généraliste',
  'Dermatologue',
  'Pédiatre',
  'Orthopédiste',
  'Ophtalmologue',
  'ORL',
  'Neurologue',
  'Chirurgien-dentiste',
  'Psychiatre',
];

const PAGE_SIZE = 12;

export default function DoctorsPage() {
  // Filtres transmis par la page de recherche avancée (/doctors/search) et
  // par tout lien direct — auparavant totalement ignorés à l'arrivée sur
  // cette page — voir audit B21.
  const urlParams = useSearchParams();
  const initialSpecialty = urlParams.get('specialty');

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState(
    initialSpecialty && SPECIALTIES.includes(initialSpecialty) ? initialSpecialty : 'Tous'
  );
  const [sortBy, setSortBy] = useState<'rating' | 'availability'>('rating');
  const [showFilters, setShowFilters] = useState(false);
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available'>(
    urlParams.get('availability') === 'available' ? 'available' : 'all'
  );
  const [cityFilter] = useState(urlParams.get('location') || '');
  const [minRating] = useState(urlParams.get('minRating') || '');
  const [maxPrice] = useState(urlParams.get('maxPrice') || '');
  const [language] = useState(urlParams.get('language') || '');
  const [page, setPage] = useState(1);

  // Debounce searchQuery de 400ms
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const fetchDoctors = useCallback(async (p = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: String(PAGE_SIZE) });
    if (selectedSpecialty !== 'Tous') params.set('specialty', selectedSpecialty);
    if (availabilityFilter === 'available') params.set('available', 'true');
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (cityFilter) params.set('location', cityFilter);
    if (minRating) params.set('minRating', minRating);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (language) params.set('language', language);
    try {
      const res = await fetch(`/api/doctors?${params}`);
      const data = await res.json();
      setDoctors(data.doctors || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch {
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  }, [selectedSpecialty, availabilityFilter, debouncedSearch, cityFilter, minRating, maxPrice, language]);

  useEffect(() => {
    setPage(1);
    fetchDoctors(1);
  }, [fetchDoctors]);

  const goToPage = (p: number) => {
    setPage(p);
    fetchDoctors(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filtered = doctors; // filtering/sorting done server-side

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Médecins</h1>
            <Link href="/" className="text-gray-600 hover:text-gray-900 font-semibold">
              ← Accueil
            </Link>
          </div>

          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un médecin ou une spécialité..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold flex items-center gap-2"
            >
              <Filter size={20} />
              Filtres
            </button>
          </div>
        </div>

        {/* Specialty Tabs */}
        <div className="border-t border-gray-200 overflow-x-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-2 py-3">
            {SPECIALTIES.map(s => (
              <button
                key={s}
                onClick={() => setSelectedSpecialty(s)}
                className={`px-4 py-2 rounded-full whitespace-nowrap font-semibold transition-all ${
                  selectedSpecialty === s
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {showFilters && (
          <div className="border-t border-gray-200 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Trier par</label>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as any)}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                  >
                    <option value="rating">Note</option>
                    <option value="availability">Disponibilité</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Disponibilité</label>
                  <select
                    value={availabilityFilter}
                    onChange={e => setAvailabilityFilter(e.target.value as any)}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                  >
                    <option value="all">Tous</option>
                    <option value="available">Disponibles maintenant</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-gray-600">
                <span className="font-bold text-gray-900">{total}</span>{' '}
                médecin{total > 1 ? 's' : ''} trouvé{total > 1 ? 's' : ''}
                {pages > 1 && (
                  <span className="text-gray-500"> — page {page}/{pages}</span>
                )}
              </p>
            </div>

            {filtered.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map(doctor => (
                  <Link
                    key={doctor._id}
                    href={`/doctors/${doctor._id}`}
                    className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all overflow-hidden border border-gray-200 hover:border-blue-600"
                  >
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl flex-shrink-0">
                          {doctor.photo ? (
                            <img src={doctor.photo} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : '👨‍⚕️'}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 mb-1">
                            Dr. {doctor.firstName} {doctor.lastName}
                          </h3>
                          <p className="text-sm text-blue-600 font-semibold mb-2">{doctor.specialty}</p>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-bold text-gray-900">{doctor.rating.toFixed(1)}</span>
                            <span className="text-sm text-gray-600">({doctor.reviewCount})</span>
                          </div>
                        </div>
                      </div>
                      <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                        doctor.isAvailable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {doctor.isAvailable ? '✓ Disponible' : 'Non disponible'}
                      </div>
                    </div>

                    <div className="p-6 space-y-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        <p className="text-sm text-gray-600">{doctor.city}</p>
                      </div>
                      {doctor.languages.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {doctor.languages.map(lang => (
                            <span key={lang} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              {lang}
                            </span>
                          ))}
                        </div>
                      )}
                      {doctor.consultationFee && (
                        <div className="pt-3 border-t border-gray-200">
                          <p className="text-sm text-gray-600">
                            Consultation à partir de{' '}
                            <span className="font-bold text-gray-900">
                              {doctor.consultationFee.toLocaleString()} FG
                            </span>
                          </p>
                        </div>
                      )}
                    </div>

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
                <p className="text-gray-600 text-lg mb-4">
                  Aucun médecin trouvé pour ces critères.
                </p>
                <button
                  onClick={() => { setSearchQuery(''); setSelectedSpecialty('Tous'); setAvailabilityFilter('all'); }}
                  className="text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            )}

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page === 1}
                  className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-300 font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft size={18} /> Précédent
                </button>

                <div className="flex gap-1">
                  {Array.from({ length: pages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === pages || Math.abs(p - page) <= 2)
                    .reduce<(number | '...')[]>((acc, p, i, arr) => {
                      if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...');
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, i) =>
                      p === '...' ? (
                        <span key={`ellipsis-${i}`} className="px-3 py-2 text-gray-400">…</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => goToPage(p as number)}
                          className={`w-10 h-10 rounded-lg font-bold transition ${
                            page === p
                              ? 'bg-blue-600 text-white'
                              : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {p}
                        </button>
                      )
                    )}
                </div>

                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page === pages}
                  className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-300 font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Suivant <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
