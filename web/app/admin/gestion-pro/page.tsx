'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, ShieldCheck, ShieldOff, ChevronLeft, ChevronRight, Eye, EyeOff, CheckCircle, PauseCircle, XCircle, RefreshCw } from 'lucide-react';

interface ProItem {
  _id: string;
  _type: 'doctor' | 'pharmacy';
  firstName?: string;
  lastName?: string;
  name?: string;
  specialty?: string;
  city: string;
  email?: string;
  isVerified: boolean;
  isAvailable: boolean;
  subscriptionStatus: 'active' | 'suspended' | 'expired' | 'none';
  subscriptionPlan?: string;
  subscriptionExpiresAt?: string;
  rating: number;
  reviewCount: number;
  createdAt: string;
}

const SUB_STATUS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  active:    { label: 'Actif',    color: 'bg-green-100 text-green-700',   icon: <CheckCircle size={12} /> },
  suspended: { label: 'Suspendu', color: 'bg-orange-100 text-orange-700', icon: <PauseCircle size={12} /> },
  expired:   { label: 'Expiré',   color: 'bg-red-100 text-red-700',       icon: <XCircle size={12} /> },
  none:      { label: 'Aucun',    color: 'bg-gray-100 text-gray-500',     icon: null },
};

const PLANS = ['Essentiel', 'Confort', 'Excellence'];

export default function GestionProPage() {
  const [items, setItems] = useState<ProItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [subFilter, setSubFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [planModal, setPlanModal] = useState<ProItem | null>(null);
  const [planForm, setPlanForm] = useState({ plan: 'Essentiel', expires: '' });

  const load = useCallback(() => {
    setLoading(true);
    const qs = new URLSearchParams({ page: String(page) });
    if (search) qs.set('search', search);
    if (typeFilter) qs.set('type', typeFilter);
    if (subFilter) qs.set('sub', subFilter);
    fetch(`/api/admin/gestion-pro?${qs}`)
      .then(r => r.json())
      .then(data => {
        setItems(data.items || []);
        setTotal(data.total || 0);
        setPages(data.pages || 1);
      })
      .finally(() => setLoading(false));
  }, [page, search, typeFilter, subFilter]);

  useEffect(() => { load(); }, [load]);

  const patch = async (item: ProItem, update: Record<string, unknown>) => {
    const key = item._id + JSON.stringify(update);
    setUpdating(key);
    const res = await fetch(`/api/admin/gestion-pro/${item._type}/${item._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    });
    if (res.ok) {
      const data = await res.json();
      setItems(prev => prev.map(i => i._id === item._id ? { ...i, ...data.item } : i));
    }
    setUpdating(null);
  };

  const displayName = (item: ProItem) =>
    item._type === 'doctor'
      ? `Dr. ${item.firstName} ${item.lastName}`
      : item.name || '';

  const applyPlan = async () => {
    if (!planModal) return;
    const expires = planForm.expires ? planForm.expires : undefined;
    await patch(planModal, {
      subscriptionStatus: 'active',
      subscriptionPlan: planForm.plan,
      ...(expires ? { subscriptionExpiresAt: expires } : {}),
    });
    setPlanModal(null);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Gestion Pro</h2>
        <p className="text-sm text-gray-500 mt-0.5">{total} profils professionnels</p>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="flex-1 flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 min-w-[200px]">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            placeholder="Nom, spécialité..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="flex-1 outline-none text-sm"
          />
        </div>
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none">
          <option value="">Médecins + Cabinets</option>
          <option value="doctor">Médecins</option>
          <option value="pharmacy">Cabinets / Pharmacies</option>
        </select>
        <select value={subFilter} onChange={e => { setSubFilter(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none">
          <option value="">Tous abonnements</option>
          <option value="active">Actifs</option>
          <option value="suspended">Suspendus</option>
          <option value="expired">Expirés</option>
          <option value="none">Sans abonnement</option>
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
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Profil</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Type / Spécialité</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Vérifié</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Visible</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Abonnement</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Plan</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map(item => {
                  const sub = SUB_STATUS[item.subscriptionStatus] || SUB_STATUS.none;
                  const busyKey = item._id;
                  return (
                    <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${item._type === 'doctor' ? 'bg-teal-100 text-teal-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {item._type === 'doctor' ? '👨‍⚕️' : '💊'}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{displayName(item)}</p>
                            <p className="text-xs text-gray-400">{item.city} · {item.email || ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-600">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${item._type === 'doctor' ? 'bg-teal-50 text-teal-700' : 'bg-emerald-50 text-emerald-700'}`}>
                          {item._type === 'doctor' ? item.specialty || 'Médecin' : 'Pharmacie / Cabinet'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => patch(item, { isVerified: !item.isVerified })}
                          disabled={!!updating}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition ${item.isVerified ? 'bg-teal-100 text-teal-700 hover:bg-teal-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'} disabled:opacity-40`}
                        >
                          {item.isVerified ? <><ShieldCheck size={11} /> Oui</> : <><ShieldOff size={11} /> Non</>}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => patch(item, { isAvailable: !item.isAvailable })}
                          disabled={!!updating}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition ${item.isAvailable ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-600 hover:bg-red-200'} disabled:opacity-40`}
                        >
                          {item.isAvailable ? <><Eye size={11} /> Actif</> : <><EyeOff size={11} /> Masqué</>}
                        </button>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${sub.color}`}>
                          {sub.icon} {sub.label}
                        </span>
                        {item.subscriptionExpiresAt && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            Exp. {new Date(item.subscriptionExpiresAt).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-600">
                        {item.subscriptionPlan || <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1 flex-wrap">
                          {/* Activer abonnement */}
                          <button
                            onClick={() => { setPlanModal(item); setPlanForm({ plan: item.subscriptionPlan || 'Essentiel', expires: '' }); }}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-semibold rounded-lg transition"
                            title="Activer / réitérer abonnement"
                          >
                            <RefreshCw size={11} /> Abonnement
                          </button>
                          {/* Suspendre */}
                          {item.subscriptionStatus === 'active' && (
                            <button
                              onClick={() => patch(item, { subscriptionStatus: 'suspended' })}
                              disabled={!!updating}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-semibold rounded-lg transition disabled:opacity-40"
                            >
                              <PauseCircle size={11} /> Suspendre
                            </button>
                          )}
                          {/* Réactiver si suspendu */}
                          {item.subscriptionStatus === 'suspended' && (
                            <button
                              onClick={() => patch(item, { subscriptionStatus: 'active' })}
                              disabled={!!updating}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-semibold rounded-lg transition disabled:opacity-40"
                            >
                              <CheckCircle size={11} /> Réactiver
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {items.length === 0 && (
              <p className="text-center text-gray-400 py-10">Aucun profil trouvé</p>
            )}
          </div>
        )}

        {pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">Page {page} / {pages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"><ChevronLeft size={16} /></button>
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="p-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Modal abonnement */}
      {planModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4" onClick={() => setPlanModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Attribuer un abonnement</h3>
            <p className="text-sm text-gray-500 mb-5">{displayName(planModal)}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Plan</label>
                <select
                  value={planForm.plan}
                  onChange={e => setPlanForm(f => ({ ...f, plan: e.target.value }))}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-teal-400"
                >
                  {PLANS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date d'expiration (optionnelle)</label>
                <input
                  type="date"
                  value={planForm.expires}
                  onChange={e => setPlanForm(f => ({ ...f, expires: e.target.value }))}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-teal-400"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setPlanModal(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
                  Annuler
                </button>
                <button onClick={applyPlan} className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-bold transition">
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
