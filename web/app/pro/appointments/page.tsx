'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Calendar, Clock, User, Phone, Mail, Search, Filter,
  Edit, Trash2, X, Check, AlertCircle, Loader2,
} from 'lucide-react';

interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
}

interface Appointment {
  _id: string;
  patientId: Patient;
  date: string;
  time: string;
  reason?: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  notes?: string;
}

const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Confirmé',
  pending: 'En Attente',
  cancelled: 'Annulé',
  completed: 'Complété',
};

const STATUS_COLORS: Record<string, string> = {
  confirmed: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  cancelled: 'bg-red-100 text-red-800',
  completed: 'bg-blue-100 text-blue-800',
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/pro/appointments?status=${filterStatus}`);
      const data = await res.json();
      if (res.ok) {
        setAppointments(data.appointments);
      } else {
        setError(data.error || 'Erreur lors du chargement');
      }
    } catch {
      setError('Erreur réseau');
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  const filtered = appointments.filter((apt) => {
    const name = `${apt.patientId.firstName} ${apt.patientId.lastName}`.toLowerCase();
    const phone = apt.patientId.phone || '';
    return name.includes(searchTerm.toLowerCase()) || phone.includes(searchTerm);
  });

  const openEdit = (apt: Appointment) => {
    setSelected(apt);
    setEditStatus(apt.status);
    setEditNotes(apt.notes || '');
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch('/api/pro/appointments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: selected._id, status: editStatus, notes: editNotes }),
      });
      const data = await res.json();
      if (res.ok) {
        setAppointments(prev =>
          prev.map(a => a._id === selected._id ? data.appointment : a)
        );
        setShowEditModal(false);
      } else {
        setError(data.error || 'Erreur lors de la mise à jour');
      }
    } catch {
      setError('Erreur réseau');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/pro/appointments?id=${selected._id}`, { method: 'DELETE' });
      if (res.ok) {
        setAppointments(prev => prev.filter(a => a._id !== selected._id));
        setShowDeleteModal(false);
      } else {
        const data = await res.json();
        setError(data.error || 'Erreur lors de la suppression');
      }
    } catch {
      setError('Erreur réseau');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Gestion des Rendez-vous</h1>
          <p className="text-gray-600 mt-2">Gérez tous vos rendez-vous patients</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher par nom ou téléphone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="confirmed">Confirmé</option>
              <option value="pending">En Attente</option>
              <option value="cancelled">Annulé</option>
              <option value="completed">Complété</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Patient</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Contact</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Date & Heure</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Motif</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Statut</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length > 0 ? (
                  filtered.map((apt) => (
                    <tr key={apt._id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User size={20} className="text-blue-600" />
                          </div>
                          <p className="font-medium text-gray-800">
                            {apt.patientId.firstName} {apt.patientId.lastName}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {apt.patientId.phone && (
                            <p className="text-sm text-gray-800 flex items-center gap-2">
                              <Phone size={14} /> {apt.patientId.phone}
                            </p>
                          )}
                          {apt.patientId.email && (
                            <p className="text-sm text-gray-600 flex items-center gap-2">
                              <Mail size={14} /> {apt.patientId.email}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="text-sm text-gray-800 flex items-center gap-2">
                            <Calendar size={14} />
                            {new Date(apt.date).toLocaleDateString('fr-FR')}
                          </p>
                          <p className="text-sm text-gray-600 flex items-center gap-2">
                            <Clock size={14} /> {apt.time}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-700">{apt.reason || '—'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[apt.status] || 'bg-gray-100 text-gray-800'}`}>
                          {STATUS_LABELS[apt.status] || apt.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(apt)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => { setSelected(apt); setShowDeleteModal(true); }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      Aucun rendez-vous trouvé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && selected && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Modifier le Rendez-vous</h2>
              <button onClick={() => setShowEditModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-600">
                Patient : <strong>{selected.patientId.firstName} {selected.patientId.lastName}</strong>
                <br />
                Date : <strong>{new Date(selected.date).toLocaleDateString('fr-FR')}</strong> à <strong>{selected.time}</strong>
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">En Attente</option>
                  <option value="confirmed">Confirmé</option>
                  <option value="completed">Complété</option>
                  <option value="cancelled">Annulé</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Notes supplémentaires..."
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
                Annuler
              </button>
              <button
                onClick={handleUpdate}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selected && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Supprimer le Rendez-vous</h2>
              <button onClick={() => setShowDeleteModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
                <AlertCircle className="text-red-600" size={24} />
                <div>
                  <p className="font-medium text-red-800">Êtes-vous sûr ?</p>
                  <p className="text-sm text-red-700">Cette action ne peut pas être annulée</p>
                </div>
              </div>
              <p className="text-gray-600">
                Supprimer le rendez-vous de{' '}
                <strong>{selected.patientId.firstName} {selected.patientId.lastName}</strong>{' '}
                le <strong>{new Date(selected.date).toLocaleDateString('fr-FR')}</strong> à{' '}
                <strong>{selected.time}</strong>.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={saving}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
