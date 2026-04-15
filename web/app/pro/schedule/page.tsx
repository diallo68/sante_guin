'use client';

import { useState } from 'react';
import { Clock, Plus, Edit, Trash2, X, Check, AlertCircle } from 'lucide-react';

interface Schedule {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  isOpen: boolean;
}

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([
    { id: '1', day: 'Lundi', startTime: '08:00', endTime: '17:00', isOpen: true },
    { id: '2', day: 'Mardi', startTime: '08:00', endTime: '17:00', isOpen: true },
    { id: '3', day: 'Mercredi', startTime: '08:00', endTime: '17:00', isOpen: true },
    { id: '4', day: 'Jeudi', startTime: '08:00', endTime: '17:00', isOpen: true },
    { id: '5', day: 'Vendredi', startTime: '08:00', endTime: '17:00', isOpen: true },
    { id: '6', day: 'Samedi', startTime: '09:00', endTime: '13:00', isOpen: true },
    { id: '7', day: 'Dimanche', startTime: '00:00', endTime: '00:00', isOpen: false },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [formData, setFormData] = useState<Partial<Schedule>>({});

  const openModal = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setFormData(schedule);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedSchedule(null);
    setFormData({});
  };

  const handleSave = () => {
    if (selectedSchedule) {
      setSchedules(
        schedules.map((s) =>
          s.id === selectedSchedule.id ? { ...s, ...formData } : s
        )
      );
    }
    closeModal();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Gestion des Horaires</h1>
        <p className="text-gray-600 mt-2">Configurez vos horaires d'ouverture et de fermeture</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
        <div>
          <p className="font-medium text-blue-800">Information</p>
          <p className="text-sm text-blue-700">Les horaires que vous configurez ici seront affichés sur votre profil public</p>
        </div>
      </div>

      <div className="space-y-3">
        {schedules.map((schedule) => (
          <div key={schedule.id} className="bg-white rounded-lg shadow p-6 flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="text-blue-600" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">{schedule.day}</h3>
                {schedule.isOpen ? (
                  <p className="text-sm text-gray-600">{schedule.startTime} - {schedule.endTime}</p>
                ) : (
                  <p className="text-sm text-red-600 font-medium">Fermé</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => openModal(schedule)}
                className="px-4 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Modifier
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && selectedSchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Modifier Horaires - {selectedSchedule.day}</h2>
              <button onClick={closeModal} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={formData.isOpen || false}
                  onChange={(e) => setFormData({ ...formData, isOpen: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label className="text-gray-700 font-medium">Ouvert ce jour</label>
              </div>

              {formData.isOpen && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Heure d'ouverture</label>
                    <input
                      type="time"
                      value={formData.startTime || ''}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Heure de fermeture</label>
                    <input
                      type="time"
                      value={formData.endTime || ''}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Check size={18} />
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
