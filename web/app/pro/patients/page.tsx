'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, ChevronLeft, ChevronRight, User, Phone, Mail, Calendar, CheckCircle, Clock, XCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface PatientRow {
  _id: string;
  totalAppointments: number;
  completedAppointments: number;
  lastAppointmentDate: string;
  lastReason?: string;
  lastStatus: string;
  patient: {
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    createdAt: string;
  };
}

interface AppointmentDetail {
  _id: string;
  date: string;
  time: string;
  reason?: string;
  status: string;
  notes?: string;
}

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-green-100 text-green-700',
  confirmed: 'bg-blue-100 text-blue-700',
  pending:   'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-red-100 text-red-600',
};
const STATUS_LABELS: Record<string, string> = {
  completed: 'Terminé',
  confirmed: 'Confirmé',
  pending:   'En attente',
  cancelled: 'Annulé',
};
const STATUS_ICONS: Record<string, React.ReactNode> = {
  completed: <CheckCircle size={12} />,
  confirmed: <CheckCircle size={12} />,
  pending:   <Clock size={12} />,
  cancelled: <XCircle size={12} />,
};

export default function PatientsPage() {
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Record<string, AppointmentDetail[]>>({});
  const [loadingAppts, setLoadingAppts] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const qs = new URLSearchParams({ page: String(page) });
    if (search) qs.set('search', search);
    fetch(`/api/pro/patients?${qs}`)
      .then(r => r.json())
      .then(data => {
        setPatients(data.patients || []);
        setTotal(data.total || 0);
        setPages(data.pages || 1);
      })
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const toggleExpand = async (patientId: string) => {
    if (expanded === patientId) {
      setExpanded(null);
      return;
    }
    setExpanded(patientId);
    if (appointments[patientId]) return;

    setLoadingAppts(patientId);
    try {
      const res = await fetch(`/api/pro/appointments?patientId=${patientId}&limit=10`);
      const data = await res.json();
      setAppointments(prev => ({ ...prev, [patientId]: data.appointments || [] }));
    } catch {/* silent */}
    finally { setLoadingAppts(null); }
  };

  const initials = (p: PatientRow['patient']) =>
    `${p.firstName[0]}${p.lastName[0]}`.toUpperCase();

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Mes Patients</h2>
        <p className="text-sm text-gray-500 mt-0.5">{total} patient{total > 1 ? 's' : ''} suivi{total > 1 ? 's' : ''}</p>
      </div>

      {/* Barre de recherche */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2.5">
          <Search size={16} className="text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Rechercher par nom, email, téléphone..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="flex-1 outline-none text-sm text-gray-800 bg-transparent"
          />
        </div>
      </div>

      {/* Liste */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : patients.length === 0 ? (
          <div className="text-center py-16">
            <User size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">Aucun patient trouvé</p>
            <p className="text-gray-300 text-sm mt-1">Les patients apparaîtront après leurs premiers rendez-vous</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {patients.map(row => (
              <div key={row._id}>
                {/* Ligne patient */}
                <button
                  onClick={() => toggleExpand(row._id)}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                >
                  {/* Avatar */}
                  <div className="w-11 h-11 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-bold text-sm flex-shrink-0">
                    {initials(row.patient)}
                  </div>

                  {/* Infos principales */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 text-sm">
                        {row.patient.firstName} {row.patient.lastName}
                      </p>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[row.lastStatus] || 'bg-gray-100 text-gray-500'}`}>
                        {STATUS_ICONS[row.lastStatus]}
                        {STATUS_LABELS[row.lastStatus] || row.lastStatus}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400 flex-wrap">
                      {row.patient.phone && (
                        <span className="flex items-center gap-1"><Phone size={11} />{row.patient.phone}</span>
                      )}
                      {row.patient.email && (
                        <span className="flex items-center gap-1"><Mail size={11} />{row.patient.email}</span>
                      )}
                    </div>
                    {row.lastReason && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">Motif : {row.lastReason}</p>
                    )}
                  </div>

                  {/* Stats & date */}
                  <div className="hidden sm:flex flex-col items-end gap-1 flex-shrink-0">
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {row.totalAppointments} RDV
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle size={11} className="text-green-500" />
                        {row.completedAppointments} terminé{row.completedAppointments > 1 ? 's' : ''}
                      </span>
                    </div>
                    <p className="text-xs text-gray-300">
                      Dernière visite : {new Date(row.lastAppointmentDate).toLocaleDateString('fr-FR')}
                    </p>
                  </div>

                  {/* Expand chevron */}
                  <div className="text-gray-300 flex-shrink-0">
                    {expanded === row._id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </button>

                {/* Historique déroulant */}
                {expanded === row._id && (
                  <div className="px-5 pb-4 bg-gray-50 border-t border-gray-100">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-3 mb-3">
                      Historique des consultations
                    </h4>

                    {/* Infos patient */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                      {[
                        { label: 'Total RDV', value: row.totalAppointments },
                        { label: 'Terminés', value: row.completedAppointments },
                        { label: 'Annulés', value: row.totalAppointments - row.completedAppointments - (patients.find(p => p._id === row._id)?.totalAppointments || 0 - row.completedAppointments) },
                        { label: 'Patient depuis', value: new Date(row.patient.createdAt).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }) },
                      ].map((s, i) => (
                        <div key={i} className="bg-white rounded-xl p-3 border border-gray-100 text-center">
                          <p className="text-lg font-bold text-gray-900">{s.value}</p>
                          <p className="text-xs text-gray-400">{s.label}</p>
                        </div>
                      ))}
                    </div>

                    {loadingAppts === row._id ? (
                      <div className="flex justify-center py-4">
                        <div className="w-6 h-6 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : appointments[row._id]?.length ? (
                      <div className="space-y-2">
                        {appointments[row._id].map(appt => (
                          <div key={appt._id} className="bg-white rounded-xl border border-gray-100 p-3 flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-semibold text-gray-800">
                                  {new Date(appt.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                                </span>
                                <span className="text-xs text-gray-400">à {appt.time}</span>
                              </div>
                              {appt.reason && (
                                <p className="text-xs text-gray-500">Motif : {appt.reason}</p>
                              )}
                              {appt.notes && (
                                <p className="text-xs text-teal-700 mt-1 bg-teal-50 px-2 py-1 rounded-lg">Notes : {appt.notes}</p>
                              )}
                            </div>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${STATUS_COLORS[appt.status] || 'bg-gray-100 text-gray-500'}`}>
                              {STATUS_ICONS[appt.status]}
                              {STATUS_LABELS[appt.status] || appt.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 text-center py-3">Aucun détail de consultation disponible</p>
                    )}
                  </div>
                )}
              </div>
            ))}
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
