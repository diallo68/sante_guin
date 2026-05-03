'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, MapPin, Star, Filter, Clock, Phone, ChevronLeft, ChevronRight, FlaskConical } from 'lucide-react';

interface Laboratory {
  _id: string;
  name: string;
  rating: number;
  reviewCount: number;
  city: string;
  address: string;
  phone?: string;
  photo?: string;
  analyses: string[];
  isOpen24h: boolean;
  openTime?: string;
  closeTime?: string;
  isVerified: boolean;
}

const PAGE_SIZE = 12;

export default function LaboratoriesPage() {
  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [open24hFilter, setOpen24hFilter] = useState(false);
  const [page, setPage] = useState(1);

  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const fetchLaboratories = useCallback(async (p = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: String(PAGE_SIZE) });
    if (open24hFilter) params.set('open24h', 'true');
    if (debouncedSearch) params.set('search', debouncedSearch);
    try {
      const res = await fetch(`/api/laboratories?${params}`);
      const data = await res.json();
      setLaboratories(data.laboratories || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch {
      setLaboratories([]);
    } finally {
      setLoading(false);
    }
  }, [open24hFilter, debouncedSearch]);

  useEffect(() => {
    setPage(1);
    fetchLaboratories(1);
  }, [fetchLaboratories]);

  const goToPage = (p: number) => {
    setPage(p);
    fetchLaboratories(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Laboratoires d'analyse</h1>
            <Link href="/" className="text-gray-600 hover:text-gray-900 font-semibold">
              ← Accueil
            </Link>
          </div>

          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un laboratoire ou une analyse..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-teal-600"
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

        {showFilters && (
          <div className="border-t border-gray-200 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <label className="flex items-center gap-3 cursor-pointer w-fit">
                <input
                  type="checkbox"
                  checked={open24hFilter}
                  onChange={e => setOpen24hFilter(e.target.checked)}
                  className="w-5 h-5 accent-teal-600"
                />
                <span className="text-sm font-semibold text-gray-700">Ouverts 24h/24 uniquement</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-gray-600">
                <span className="font-bold text-gray-900">{total}</span>{' '}
                laboratoire{total > 1 ? 's' : ''} trouvé{total > 1 ? 's' : ''}
                {pages > 1 && (
                  <span className="text-gray-500"> — page {page}/{pages}</span>
                )}
              </p>
            </div>

            {laboratories.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {laboratories.map(lab => (
                  <Link
                    key={lab._id}
                    href={`/laboratories/${lab._id}`}
                    className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all overflow-hidden border border-gray-200 hover:border-teal-600"
                  >
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                          {lab.photo ? (
                            <img src={lab.photo} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <FlaskConical className="w-8 h-8 text-teal-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 mb-1">{lab.name}</h3>
                          <div className="flex items-center gap-1 mb-2">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-bold text-gray-900">{lab.rating.toFixed(1)}</span>
                            <span className="text-sm text-gray-600">({lab.reviewCount})</span>
                          </div>
                        </div>
                      </div>
                      {lab.analyses.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {lab.analyses.slice(0, 3).map((a, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700">
                              {a}
                            </span>
                          ))}
                          {lab.analyses.length > 3 && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                              +{lab.analyses.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="p-6 space-y-3">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-600">{lab.city}</p>
                          <p className="text-xs text-gray-500">{lab.address}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        <p className="text-sm text-gray-600">
                          {lab.isOpen24h ? '24h/24' : `${lab.openTime} - ${lab.closeTime}`}
                        </p>
                      </div>
                      {lab.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          <p className="text-sm text-gray-600">{lab.phone}</p>
                        </div>
                      )}
                    </div>

                    <div className="p-6 bg-gray-50 border-t border-gray-200">
                      <button className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-lg transition-all">
                        Voir le Profil
                      </button>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FlaskConical className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg mb-4">
                  Aucun laboratoire trouvé pour ces critères.
                </p>
                <button
                  onClick={() => { setSearchQuery(''); setOpen24hFilter(false); }}
                  className="text-teal-600 hover:text-teal-700 font-semibold"
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
                              ? 'bg-teal-600 text-white'
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
