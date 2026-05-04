'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, ChevronLeft, ChevronRight, User, Phone, Mail, Calendar,
  CheckCircle, Clock, XCircle, ChevronDown, ChevronUp, UserPlus,
  X, Upload, FileText, Image as ImageIcon, Trash2, Loader2, Paperclip,
} from 'lucide-react';

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

interface ManualPatient {
  _id: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  phone?: string;
  email?: string;
  gender?: string;
  bloodGroup?: string;
  notes?: string;
  documents: { name: string; url: string; type: string; uploadedAt: string }[];
  createdAt: string;
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
  completed: 'Terminé', confirmed: 'Confirmé', pending: 'En attente', cancelled: 'Annulé',
};
const STATUS_ICONS: Record<string, React.ReactNode> = {
  completed: <CheckCircle size={12} />, confirmed: <CheckCircle size={12} />,
  pending: <Clock size={12} />, cancelled: <XCircle size={12} />,
};

const BLOOD_GROUPS = ['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−'];

const emptyForm = {
  firstName: '', lastName: '', dateOfBirth: '', phone: '',
  email: '', gender: '', bloodGroup: '', notes: '',
};

export default function PatientsPage() {
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [manual, setManual] = useState<ManualPatient[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Record<string, AppointmentDetail[]>>({});
  const [loadingAppts, setLoadingAppts] = useState<string | null>(null);
  const [expandedManual, setExpandedManual] = useState<string | null>(null);

  // Modal nouveau patient
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [newPatientId, setNewPatientId] = useState<string | null>(null);

  // Upload documents
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    setLoading(true);
    const qs = new URLSearchParams({ page: String(page) });
    if (search) qs.set('search', search);
    fetch(`/api/pro/patients?${qs}`)
      .then(r => r.json())
      .then(data => {
        setPatients(data.patients || []);
        setManual(data.manual || []);
        setTotal(data.total || 0);
        setPages(data.pages || 1);
      })
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const toggleExpand = async (patientId: string) => {
    if (expanded === patientId) { setExpanded(null); return; }
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPendingFiles(prev => [...prev, ...files]);
    e.target.value = '';
  };

  const removeFile = (idx: number) => setPendingFiles(prev => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setSaveError('Nom et prénom sont obligatoires');
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      // 1. Créer le patient
      const res = await fetch('/api/pro/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setSaveError(data.error || 'Erreur'); return; }

      const pid = data.record._id;
      setNewPatientId(pid);

      // 2. Uploader les documents si présents
      if (pendingFiles.length > 0) {
        setUploadingFiles(true);
        for (const file of pendingFiles) {
          const fd = new FormData();
          fd.append('file', file);
          fd.append('patientId', pid);
          await fetch('/api/pro/patients/upload', { method: 'POST', body: fd });
        }
        setUploadingFiles(false);
      }

      // 3. Réinitialiser et fermer
      setForm(emptyForm);
      setPendingFiles([]);
      setNewPatientId(null);
      setShowModal(false);
      load();
    } catch {
      setSaveError('Erreur de connexion');
    } finally {
      setSaving(false);
      setUploadingFiles(false);
    }
  };

  const initials = (firstName: string, lastName: string) =>
    `${firstName[0]}${lastName[0]}`.toUpperCase();

  const fileIcon = (type: string) =>
    type === 'application/pdf' ? <FileText size={14} /> : <ImageIcon size={14} />;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mes Patients</h2>
          <p className="text-sm text-gray-500 mt-0.5">{total + manual.length} patient{(total + manual.length) > 1 ? 's' : ''} suivi{(total + manual.length) > 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setSaveError(''); setForm(emptyForm); setPendingFiles([]); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition shadow-sm text-sm"
        >
          <UserPlus size={16} /> Enregistrer un Nouveau Patient
        </button>
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

      {/* Patients enregistrés manuellement */}
      {manual.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 bg-teal-50 border-b border-teal-100 flex items-center gap-2">
            <UserPlus size={15} className="text-teal-600" />
            <span className="text-sm font-semibold text-teal-700">Patients enregistrés manuellement ({manual.length})</span>
          </div>
          <div className="divide-y divide-gray-50">
            {manual.map(p => (
              <div key={p._id}>
                <button
                  onClick={() => setExpandedManual(expandedManual === p._id ? null : p._id)}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-11 h-11 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-bold text-sm flex-shrink-0">
                    {initials(p.firstName, p.lastName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{p.firstName} {p.lastName}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400 flex-wrap">
                      {p.phone && <span className="flex items-center gap-1"><Phone size={11} />{p.phone}</span>}
                      {p.email && <span className="flex items-center gap-1"><Mail size={11} />{p.email}</span>}
                      {p.dateOfBirth && (
                        <span className="flex items-center gap-1">
                          <Calendar size={11} />
                          {new Date(p.dateOfBirth).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="hidden sm:flex flex-col items-end gap-1 flex-shrink-0">
                    {p.bloodGroup && <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-bold">{p.bloodGroup}</span>}
                    {p.documents.length > 0 && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Paperclip size={11} /> {p.documents.length} document{p.documents.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <div className="text-gray-300 flex-shrink-0">
                    {expandedManual === p._id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </button>

                {expandedManual === p._id && (
                  <div className="px-5 pb-5 bg-gray-50 border-t border-gray-100 space-y-4">
                    {/* Infos */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
                      {[
                        { label: 'Genre', value: p.gender || '—' },
                        { label: 'Groupe sanguin', value: p.bloodGroup || '—' },
                        { label: 'Enregistré le', value: new Date(p.createdAt).toLocaleDateString('fr-FR') },
                        { label: 'Documents', value: p.documents.length },
                      ].map((s, i) => (
                        <div key={i} className="bg-white rounded-xl p-3 border border-gray-100 text-center">
                          <p className="text-base font-bold text-gray-900 capitalize">{s.value}</p>
                          <p className="text-xs text-gray-400">{s.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Notes */}
                    {p.notes && (
                      <div className="bg-white rounded-xl border border-gray-100 p-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Notes cliniques</p>
                        <p className="text-sm text-gray-700">{p.notes}</p>
                      </div>
                    )}

                    {/* Documents */}
                    {p.documents.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Documents ({p.documents.length})</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {p.documents.map((doc, i) => (
                            <a
                              key={i}
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 bg-white border border-gray-200 hover:border-teal-300 hover:bg-teal-50 rounded-xl px-4 py-3 transition"
                            >
                              <span className="text-teal-600">{fileIcon(doc.type)}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">{doc.name}</p>
                                <p className="text-xs text-gray-400">{new Date(doc.uploadedAt).toLocaleDateString('fr-FR')}</p>
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Patients via rendez-vous */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {patients.length > 0 && (
          <div className="px-5 py-3 bg-blue-50 border-b border-blue-100 flex items-center gap-2">
            <Calendar size={15} className="text-blue-600" />
            <span className="text-sm font-semibold text-blue-700">Patients via rendez-vous ({total})</span>
          </div>
        )}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : patients.length === 0 && manual.length === 0 ? (
          <div className="text-center py-16">
            <User size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">Aucun patient trouvé</p>
            <p className="text-gray-300 text-sm mt-1">Enregistrez votre premier patient avec le bouton ci-dessus</p>
          </div>
        ) : patients.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {patients.map(row => (
              <div key={row._id}>
                <button
                  onClick={() => toggleExpand(row._id)}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-11 h-11 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-bold text-sm flex-shrink-0">
                    {initials(row.patient.firstName, row.patient.lastName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 text-sm">{row.patient.firstName} {row.patient.lastName}</p>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[row.lastStatus] || 'bg-gray-100 text-gray-500'}`}>
                        {STATUS_ICONS[row.lastStatus]}
                        {STATUS_LABELS[row.lastStatus] || row.lastStatus}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400 flex-wrap">
                      {row.patient.phone && <span className="flex items-center gap-1"><Phone size={11} />{row.patient.phone}</span>}
                      {row.patient.email && <span className="flex items-center gap-1"><Mail size={11} />{row.patient.email}</span>}
                    </div>
                    {row.lastReason && <p className="text-xs text-gray-400 mt-0.5 truncate">Motif : {row.lastReason}</p>}
                  </div>
                  <div className="hidden sm:flex flex-col items-end gap-1 flex-shrink-0">
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Calendar size={11} />{row.totalAppointments} RDV</span>
                      <span className="flex items-center gap-1"><CheckCircle size={11} className="text-green-500" />{row.completedAppointments} terminé{row.completedAppointments > 1 ? 's' : ''}</span>
                    </div>
                    <p className="text-xs text-gray-300">Dernière visite : {new Date(row.lastAppointmentDate).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div className="text-gray-300 flex-shrink-0">
                    {expanded === row._id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </button>

                {expanded === row._id && (
                  <div className="px-5 pb-4 bg-gray-50 border-t border-gray-100">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-3 mb-3">Historique des consultations</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                      {[
                        { label: 'Total RDV', value: row.totalAppointments },
                        { label: 'Terminés', value: row.completedAppointments },
                        { label: 'Patient depuis', value: new Date(row.patient.createdAt).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }) },
                      ].map((s, i) => (
                        <div key={i} className="bg-white rounded-xl p-3 border border-gray-100 text-center">
                          <p className="text-lg font-bold text-gray-900">{s.value}</p>
                          <p className="text-xs text-gray-400">{s.label}</p>
                        </div>
                      ))}
                    </div>
                    {loadingAppts === row._id ? (
                      <div className="flex justify-center py-4"><div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>
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
                              {appt.reason && <p className="text-xs text-gray-500">Motif : {appt.reason}</p>}
                              {appt.notes && <p className="text-xs text-teal-700 mt-1 bg-teal-50 px-2 py-1 rounded-lg">Notes : {appt.notes}</p>}
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
        ) : null}

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

      {/* ── MODAL Nouveau Patient ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <UserPlus size={20} className="text-teal-600" />
                <h2 className="text-lg font-bold text-gray-900">Enregistrer un Nouveau Patient</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition">
                <X size={22} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Nom & Prénom */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Prénom <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                    placeholder="Mamadou"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 focus:border-teal-500 rounded-xl outline-none text-sm transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nom <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                    placeholder="Diallo"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 focus:border-teal-500 rounded-xl outline-none text-sm transition"
                  />
                </div>
              </div>

              {/* Date de naissance & Genre */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    <span className="flex items-center gap-1"><Calendar size={13} /> Date de Naissance</span>
                  </label>
                  <input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={e => setForm(f => ({ ...f, dateOfBirth: e.target.value }))}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 focus:border-teal-500 rounded-xl outline-none text-sm transition bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Genre</label>
                  <select
                    value={form.gender}
                    onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 focus:border-teal-500 rounded-xl outline-none text-sm transition bg-white"
                  >
                    <option value="">-- Sélectionner --</option>
                    <option value="homme">Homme</option>
                    <option value="femme">Femme</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
              </div>

              {/* Téléphone & Email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    <span className="flex items-center gap-1"><Phone size={13} /> Téléphone</span>
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+224 6XX XXX XXX"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 focus:border-teal-500 rounded-xl outline-none text-sm transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    <span className="flex items-center gap-1"><Mail size={13} /> Email</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="patient@email.com"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 focus:border-teal-500 rounded-xl outline-none text-sm transition"
                  />
                </div>
              </div>

              {/* Groupe sanguin */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Groupe sanguin</label>
                <div className="flex flex-wrap gap-2">
                  {BLOOD_GROUPS.map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, bloodGroup: f.bloodGroup === g ? '' : g }))}
                      className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition border-2 ${
                        form.bloodGroup === g
                          ? 'bg-red-500 text-white border-red-500'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-red-300'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notes / Antécédents (optionnel)</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  placeholder="Allergies, antécédents médicaux, traitement en cours..."
                  className="w-full px-4 py-2.5 border-2 border-gray-200 focus:border-teal-500 rounded-xl outline-none text-sm resize-none transition"
                />
              </div>

              {/* Upload documents */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <span className="flex items-center gap-1"><Upload size={13} /> Ajouter des documents (ordonnances, résultats labo, etc.)</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-300 hover:border-teal-400 hover:bg-teal-50 rounded-xl py-4 text-sm text-gray-500 hover:text-teal-600 transition flex items-center justify-center gap-2"
                >
                  <Paperclip size={16} /> Cliquez pour joindre des fichiers (images ou PDF)
                </button>

                {pendingFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {pendingFiles.map((file, i) => (
                      <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-100">
                        <span className="text-teal-600">
                          {file.type === 'application/pdf' ? <FileText size={15} /> : <ImageIcon size={15} />}
                        </span>
                        <span className="flex-1 text-sm text-gray-700 truncate">{file.name}</span>
                        <span className="text-xs text-gray-400">{(file.size / 1024).toFixed(0)} Ko</span>
                        <button onClick={() => removeFile(i)} className="text-gray-300 hover:text-red-500 transition">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {saveError && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{saveError}</div>
              )}

              {/* Boutons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 border-2 border-gray-200 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition text-sm"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || uploadingFiles}
                  className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 text-white font-bold rounded-xl transition text-sm flex items-center justify-center gap-2"
                >
                  {saving || uploadingFiles ? (
                    <><Loader2 size={16} className="animate-spin" /> {uploadingFiles ? 'Upload...' : 'Enregistrement...'}</>
                  ) : (
                    <><UserPlus size={16} /> Enregistrer le patient</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
