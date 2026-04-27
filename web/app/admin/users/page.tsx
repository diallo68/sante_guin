'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, ChevronLeft, ChevronRight, Trash2, ShieldCheck } from 'lucide-react';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  role: string;
  isVerified: boolean;
  createdAt: string;
}

const ROLES = ['', 'patient', 'doctor', 'pharmacist', 'admin'];
const ROLE_LABELS: Record<string, string> = {
  patient: 'Patient',
  doctor: 'Médecin',
  pharmacist: 'Pharmacien',
  admin: 'Admin',
};
const ROLE_COLORS: Record<string, string> = {
  patient: 'bg-blue-100 text-blue-700',
  doctor: 'bg-teal-100 text-teal-700',
  pharmacist: 'bg-emerald-100 text-emerald-700',
  admin: 'bg-red-100 text-red-700',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const qs = new URLSearchParams({ page: String(page) });
    if (search) qs.set('search', search);
    if (roleFilter) qs.set('role', roleFilter);
    fetch(`/api/admin/users?${qs}`)
      .then(r => r.json())
      .then(data => {
        setUsers(data.users || []);
        setTotal(data.total || 0);
        setPages(data.pages || 1);
      })
      .finally(() => setLoading(false));
  }, [page, search, roleFilter]);

  useEffect(() => { load(); }, [load]);

  const changeRole = async (id: string, role: string) => {
    setUpdating(id);
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    if (res.ok) {
      const data = await res.json();
      setUsers(prev => prev.map(u => u._id === id ? { ...u, role: data.user.role } : u));
    }
    setUpdating(null);
  };

  const deleteUser = async (id: string, name: string) => {
    if (!confirm(`Supprimer définitivement ${name} ?`)) return;
    setUpdating(id);
    await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    setUsers(prev => prev.filter(u => u._id !== id));
    setTotal(t => t - 1);
    setUpdating(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Utilisateurs</h2>
          <p className="text-sm text-gray-500 mt-0.5">{total} comptes enregistrés</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, email, téléphone..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="flex-1 outline-none text-sm"
          />
        </div>
        <select
          value={roleFilter}
          onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none"
        >
          {ROLES.map(r => (
            <option key={r} value={r}>{r ? ROLE_LABELS[r] : 'Tous les rôles'}</option>
          ))}
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
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Nom</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Contact</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Rôle</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Inscrit le</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map(u => (
                  <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
                          {u.firstName[0]}{u.lastName[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{u.firstName} {u.lastName}</p>
                          {u.isVerified && (
                            <span className="text-xs text-teal-600 flex items-center gap-0.5">
                              <ShieldCheck size={10} /> Vérifié
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-500">
                      <p>{u.email || '—'}</p>
                      <p className="text-xs">{u.phone || ''}</p>
                    </td>
                    <td className="px-5 py-3">
                      <select
                        value={u.role}
                        disabled={updating === u._id}
                        onChange={e => changeRole(u._id, e.target.value)}
                        className={`text-xs font-bold px-2 py-1 rounded-full border-0 outline-none cursor-pointer ${ROLE_COLORS[u.role] || 'bg-gray-100 text-gray-700'}`}
                      >
                        {['patient', 'doctor', 'pharmacist', 'admin'].map(r => (
                          <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs">
                      {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => deleteUser(u._id, `${u.firstName} ${u.lastName}`)}
                        disabled={updating === u._id}
                        className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition disabled:opacity-40"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <p className="text-center text-gray-400 py-10">Aucun utilisateur trouvé</p>
            )}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">Page {page} / {pages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="p-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
