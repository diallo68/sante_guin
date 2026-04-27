'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, ShieldCheck, ShieldOff, ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';

interface Doctor {
  _id: string;
  firstName: string;
  lastName: string;
  specialty: string;
  city: string;
  email?: string;
  phone?: string;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  isAvailable: boolean;
  createdAt: string;
}

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const qs = new URLSearchParams({ page: String(page) });
    if (search) qs.set('search', search);
    if (verifiedFilter) qs.set('verified', verifiedFilter);
    fetch(`/api/admin/doctors?${qs}`)
      .then(r => r.json())
      .then(data => {
        setDoctors(data.doctors || []);
        setTotal(data.total || 0);
        setPages(data.pages || 1);
      })
      .finally(() => setLoading(false));
  }, [page, search, verifiedFilter]);

  useEffect(() => { load(); }, [load]);

  const toggle = async (id: string, field: 'isVerified' | 'isAvailable', value: boolean) => {
    setUpdating(id + field);
    const res = await fetch(`/api/admin/doctors/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    });
    if (res.ok) {
      setDoctors(prev => prev.map(d => d._id === id ? { ...d, [field]: value } : d));
    }
    setUpdating(null);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Médecins</h2>
        <p className="text-sm text-gray-500 mt-0.5">{total} médecins inscrits</p>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            placeholder="Nom, spécialité..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="flex-1 outline-none text-sm"
          />
        </div>
        <select
          value={verifiedFilter}
          onChange={e => { setVerifiedFilter(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none"
        >
          <option value="">Tous</option>
          <option value="true">Vérifiés</option>
          <option value="false">Non vérifiés</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-7 h-7 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Médecin</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Spécialité</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Ville</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Note</th>
                  <th className="text-center px-5 py-3 font-semibold text-gray-600">Vérifié</th>
                  <th className="text-center px-5 py-3 font-semibold text-gray-600">Disponible</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Inscrit le</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {doctors.map(d => (
                  <tr key={d._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 bg-teal-100 rounded-full flex items-center justify-center text-xs font-bold text-teal-700 flex-shrink-0">
                          {d.firstName[0]}{d.lastName[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Dr. {d.firstName} {d.lastName}</p>
                          <p className="text-xs text-gray-400">{d.email || d.phone || ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{d.specialty}</td>
                    <td className="px-5 py-3 text-gray-500">{d.city}</td>
                    <td className="px-5 py-3">
                      <span className="font-bold text-yellow-500">{d.rating.toFixed(1)}</span>
                      <span className="text-xs text-gray-400 ml-1">({d.reviewCount})</span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => toggle(d._id, 'isVerified', !d.isVerified)}
                        disabled={updating === d._id + 'isVerified'}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition ${
                          d.isVerified
                            ? 'bg-teal-100 text-teal-700 hover:bg-teal-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        } disabled:opacity-40`}
                      >
                        {d.isVerified ? <><ShieldCheck size={12} /> Vérifié</> : <><ShieldOff size={12} /> Non vérifié</>}
                      </button>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => toggle(d._id, 'isAvailable', !d.isAvailable)}
                        disabled={updating === d._id + 'isAvailable'}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition ${
                          d.isAvailable
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-red-100 text-red-600 hover:bg-red-200'
                        } disabled:opacity-40`}
                      >
                        {d.isAvailable ? <><Eye size={12} /> Actif</> : <><EyeOff size={12} /> Masqué</>}
                      </button>
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs">
                      {new Date(d.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {doctors.length === 0 && (
              <p className="text-center text-gray-400 py-10">Aucun médecin trouvé</p>
            )}
          </div>
        )}

        {pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">Page {page} / {pages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="p-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
