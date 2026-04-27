'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Appointment {
  _id: string;
  patientId: { firstName: string; lastName: string; email?: string };
  doctorId: { firstName: string; lastName: string; specialty: string };
  date: string;
  time: string;
  reason?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmé',
  cancelled: 'Annulé',
  completed: 'Terminé',
};
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-orange-100 text-orange-700',
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
  completed: 'bg-blue-100 text-blue-700',
};

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    const qs = new URLSearchParams({ page: String(page) });
    if (statusFilter) qs.set('status', statusFilter);
    fetch(`/api/admin/appointments?${qs}`)
      .then(r => r.json())
      .then(data => {
        setAppointments(data.appointments || []);
        setTotal(data.total || 0);
        setPages(data.pages || 1);
      })
      .finally(() => setLoading(false));
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Rendez-vous</h2>
        <p className="text-sm text-gray-500 mt-0.5">{total} rendez-vous au total</p>
      </div>

      {/* Filtre statut */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex gap-3 flex-wrap">
        {['', 'pending', 'confirmed', 'cancelled', 'completed'].map(s => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              statusFilter === s
                ? 'bg-teal-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s ? STATUS_LABELS[s] : 'Tous'}
          </button>
        ))}
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
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Patient</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Médecin</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Date & Heure</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Motif</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Statut</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Créé le</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {appointments.map(a => (
                  <tr key={a._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-gray-900">{a.patientId?.firstName} {a.patientId?.lastName}</p>
                      <p className="text-xs text-gray-400">{a.patientId?.email || ''}</p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-800">Dr. {a.doctorId?.firstName} {a.doctorId?.lastName}</p>
                      <p className="text-xs text-teal-600">{a.doctorId?.specialty}</p>
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      <p>{new Date(a.date).toLocaleDateString('fr-FR')}</p>
                      <p className="text-xs text-gray-400">{a.time}</p>
                    </td>
                    <td className="px-5 py-3 text-gray-500 max-w-xs">
                      <p className="truncate">{a.reason || '—'}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[a.status]}`}>
                        {STATUS_LABELS[a.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs">
                      {new Date(a.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {appointments.length === 0 && (
              <p className="text-center text-gray-400 py-10">Aucun rendez-vous trouvé</p>
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
