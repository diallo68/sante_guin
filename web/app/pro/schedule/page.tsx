'use client';

import { useState, useEffect } from 'react';
import { Clock, X, Check, AlertCircle, Loader2, Save } from 'lucide-react';

interface DaySchedule {
  day: string;
  startTime: string;
  endTime: string;
  isOpen: boolean;
}

const DEFAULT_SCHEDULE: DaySchedule[] = [
  { day: 'Lundi', startTime: '08:00', endTime: '17:00', isOpen: true },
  { day: 'Mardi', startTime: '08:00', endTime: '17:00', isOpen: true },
  { day: 'Mercredi', startTime: '08:00', endTime: '17:00', isOpen: true },
  { day: 'Jeudi', startTime: '08:00', endTime: '17:00', isOpen: true },
  { day: 'Vendredi', startTime: '08:00', endTime: '17:00', isOpen: true },
  { day: 'Samedi', startTime: '09:00', endTime: '13:00', isOpen: true },
  { day: 'Dimanche', startTime: '00:00', endTime: '00:00', isOpen: false },
];

export default function SchedulePage() {
  const [schedule, setSchedule] = useState<DaySchedule[]>(DEFAULT_SCHEDULE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<DaySchedule | null>(null);

  useEffect(() => {
    fetch('/api/pro/schedule')
      .then(r => r.json())
      .then(data => {
        if (data.schedule && Array.isArray(data.schedule) && data.schedule.length > 0) {
          setSchedule(data.schedule);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const openModal = (index: number) => {
    setEditingIndex(index);
    setFormData({ ...schedule[index] });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingIndex(null);
    setFormData(null);
  };

  const handleLocalSave = () => {
    if (editingIndex === null || !formData) return;
    const updated = schedule.map((s, i) => (i === editingIndex ? formData : s));
    setSchedule(updated);
    closeModal();
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/pro/schedule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.schedule) setSchedule(data.schedule);
        setSuccess('Horaires enregistrés avec succès');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Erreur lors de la sauvegarde');
      }
    } catch {
      setError('Erreur réseau');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Gestion des Horaires</h1>
          <p className="text-gray-600 mt-2">Configurez vos horaires d&apos;ouverture et de fermeture</p>
        </div>
        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
          Enregistrer tout
        </button>
      </div>

      {success && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          <Check size={20} />
          <p>{success}</p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
        <div>
          <p className="font-medium text-blue-800">Information</p>
          <p className="text-sm text-blue-700">
            Modifiez chaque jour, puis cliquez sur &quot;Enregistrer tout&quot; pour sauvegarder vos horaires.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {schedule.map((s, index) => (
          <div key={s.day} className="bg-white rounded-lg shadow p-6 flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="text-blue-600" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">{s.day}</h3>
                {s.isOpen ? (
                  <p className="text-sm text-gray-600">{s.startTime} – {s.endTime}</p>
                ) : (
                  <p className="text-sm text-red-600 font-medium">Fermé</p>
                )}
              </div>
            </div>
            <button
              onClick={() => openModal(index)}
              className="px-4 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Modifier
            </button>
          </div>
        ))}
      </div>

      {showModal && formData && editingIndex !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">
                Modifier Horaires – {schedule[editingIndex].day}
              </h2>
              <button onClick={closeModal} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={formData.isOpen}
                  onChange={(e) => setFormData({ ...formData, isOpen: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  id="isOpen"
                />
                <label htmlFor="isOpen" className="text-gray-700 font-medium">Ouvert ce jour</label>
              </div>
              {formData.isOpen && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Heure d&apos;ouverture</label>
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Heure de fermeture</label>
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button onClick={closeModal} className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
                Annuler
              </button>
              <button
                onClick={handleLocalSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Check size={18} />
                Appliquer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
