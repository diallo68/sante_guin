'use client';

import { useState, useEffect, useCallback } from 'react';
import { Clock, CheckCircle, Phone, Mail, MapPin, FileText, RefreshCw, X } from 'lucide-react';

type Status = 'all' | 'pending' | 'contacted' | 'active' | 'rejected';

interface Request {
  _id: string;
  nom: string;
  telephone: string;
  email: string;
  localisation: string;
  planName: string;
  message: string;
  status: 'pending' | 'contacted' | 'active' | 'rejected';
  adminNote: string;
  createdAt: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:   { label: 'En attente',  color: 'bg-yellow-100 text-yellow-800' },
  contacted: { label: 'Contacté',    color: 'bg-blue-100 text-blue-800' },
  active:    { label: 'Actif',       color: 'bg-green-100 text-green-800' },
  rejected:  { label: 'Refusé',      color: 'bg-red-100 text-red-800' },
};

const PLAN_COLORS: Record<string, string> = {
  Essentiel:  'bg-blue-100 text-blue-800',
  Confort:    'bg-teal-100 text-teal-800',
  Excellence: 'bg-purple-100 text-purple-800',
};

export default function DemandesProPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [filter, setFilter] = useState<Status>('all');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Request | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/subscription-requests?status=${filter}`);
    const data = await res.json();
    setRequests(data.requests || []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const openDetail = (r: Request) => {
    setSelected(r);
    setNote(r.adminNote || '');
  };

  const updateStatus = async (id: string, status: string) => {
    setSaving(true);
    await fetch('/api/admin/subscription-requests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, adminNote: note }),
    });
    setSaving(false);
    setSelected(null);
    fetchRequests();
  };

  const sendMessage = async () => {
    if (!selected || !note.trim()) return;
    setSaving(true);
    await fetch('/api/admin/subscription-requests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selected._id, adminNote: note, sendMessageOnly: true }),
    });
    setSaving(false);
    setSelected(null);
    fetchRequests();
  };

  const counts = {
    all: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
  };

  const FILTERS: { key: Status; label: string }[] = [
    { key: 'all', label: 'Toutes' },
    { key: 'pending', label: 'En attente' },
    { key: 'contacted', label: 'Contactés' },
    { key: 'active', label: 'Actifs' },
    { key: 'rejected', label: 'Refusés' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Demandes d'abonnement Pro</h1>
          <p className="text-gray-500 text-sm mt-1">Gérez les demandes de souscription reçues depuis le site</p>
        </div>
        <button onClick={fetchRequests} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-2 transition">
          <RefreshCw size={14} /> Actualiser
        </button>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              filter === f.key
                ? 'bg-teal-600 text-white shadow'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-teal-300'
            }`}
          >
            {f.label}
            {f.key === 'pending' && counts.pending > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                {counts.pending}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">Chargement…</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <CheckCircle size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500">Aucune demande{filter !== 'all' ? ` (${FILTERS.find(f=>f.key===filter)?.label})` : ''}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Date', 'Nom', 'Contact', 'Offre', 'Localisation', 'Statut', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {requests.map(r => (
                <tr key={r._id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-4 text-gray-500 whitespace-nowrap">
                    {new Date(r.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-4 font-semibold text-gray-900">{r.nom}</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="flex items-center gap-1 text-gray-600"><Phone size={11} /> {r.telephone}</span>
                      {r.email && <span className="flex items-center gap-1 text-gray-400 text-xs"><Mail size={11} /> {r.email}</span>}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${PLAN_COLORS[r.planName] || 'bg-gray-100 text-gray-700'}`}>
                      {r.planName}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-500">
                    {r.localisation ? <span className="flex items-center gap-1"><MapPin size={11} /> {r.localisation}</span> : '—'}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_LABELS[r.status]?.color}`}>
                      {STATUS_LABELS[r.status]?.label}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => openDetail(r)}
                      className="flex items-center gap-1 text-teal-600 hover:text-teal-800 font-semibold text-xs border border-teal-200 rounded-lg px-3 py-1.5 hover:bg-teal-50 transition"
                    >
                      <FileText size={12} /> Détails
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal détail */}
      {selected && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <p className="text-xs text-teal-600 font-bold uppercase tracking-wider">Offre {selected.planName}</p>
                <h2 className="text-lg font-bold text-gray-900">{selected.nom}</h2>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-400 text-xs mb-1">Téléphone</p>
                  <a href={`tel:${selected.telephone}`} className="font-semibold text-teal-600">{selected.telephone}</a>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-400 text-xs mb-1">Email</p>
                  <span className="font-semibold text-gray-700">{selected.email || '—'}</span>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-400 text-xs mb-1">Localisation</p>
                  <span className="font-semibold text-gray-700">{selected.localisation || '—'}</span>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-400 text-xs mb-1">Date</p>
                  <span className="font-semibold text-gray-700">
                    {new Date(selected.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>

              {selected.message && (
                <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 leading-relaxed">
                  <p className="text-gray-400 text-xs mb-2 font-semibold uppercase tracking-wide">Message</p>
                  {selected.message}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Message à envoyer à l'utilisateur
                </label>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  rows={3}
                  placeholder="Écrivez votre message ici…"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 resize-none"
                />
              </div>

              {/* 3 actions */}
              <div className="flex flex-col gap-2 pt-1">
                <button
                  onClick={() => updateStatus(selected._id, 'active')}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-bold py-3 px-4 rounded-xl transition text-sm"
                >
                  ✅ Approuver + Activer l'abonnement
                </button>
                <button
                  onClick={() => updateStatus(selected._id, 'rejected')}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white font-bold py-3 px-4 rounded-xl transition text-sm"
                >
                  ❌ Refuser la demande
                </button>
                <button
                  onClick={sendMessage}
                  disabled={saving || !note.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-gray-700 font-bold py-3 px-4 rounded-xl transition text-sm border border-gray-200"
                >
                  ✉️ Envoyer un message sans décision
                </button>
                {saving && <p className="text-center text-xs text-gray-400">Traitement en cours…</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
