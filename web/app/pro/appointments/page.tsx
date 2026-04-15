'use client';

import { useState } from 'react';
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  X,
  Check,
  AlertCircle,
} from 'lucide-react';

interface Appointment {
  id: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  date: string;
  time: string;
  type: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  notes: string;
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([
    {
      id: '1',
      patientName: 'Mamadou Diallo',
      patientPhone: '+224 612 345 678',
      patientEmail: 'mamadou@example.com',
      date: '2024-04-16',
      time: '10:00',
      type: 'Consultation Générale',
      status: 'confirmed',
      notes: 'Suivi de tension artérielle',
    },
    {
      id: '2',
      patientName: 'Aissatou Bah',
      patientPhone: '+224 623 456 789',
      patientEmail: 'aissatou@example.com',
      date: '2024-04-16',
      time: '11:30',
      type: 'Suivi Post-Opératoire',
      status: 'confirmed',
      notes: 'Vérification des points de suture',
    },
    {
      id: '3',
      patientName: 'Ibrahima Sow',
      patientPhone: '+224 634 567 890',
      patientEmail: 'ibrahima@example.com',
      date: '2024-04-16',
      time: '14:00',
      type: 'Consultation Spécialisée',
      status: 'pending',
      notes: 'Dermatologie',
    },
    {
      id: '4',
      patientName: 'Fatoumata Diallo',
      patientPhone: '+224 645 678 901',
      patientEmail: 'fatoumata@example.com',
      date: '2024-04-16',
      time: '15:30',
      type: 'Consultation Générale',
      status: 'confirmed',
      notes: 'Douleurs abdominales',
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'delete'>('add');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [formData, setFormData] = useState<Partial<Appointment>>({});

  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch =
      apt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.patientPhone.includes(searchTerm) ||
      apt.patientEmail.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || apt.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmé';
      case 'pending':
        return 'En Attente';
      case 'cancelled':
        return 'Annulé';
      default:
        return status;
    }
  };

  const openModal = (mode: 'add' | 'edit' | 'delete', appointment?: Appointment) => {
    setModalMode(mode);
    if (appointment) {
      setSelectedAppointment(appointment);
      setFormData(appointment);
    } else {
      setFormData({});
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedAppointment(null);
    setFormData({});
  };

  const handleSave = () => {
    if (modalMode === 'add') {
      const newAppointment: Appointment = {
        id: Date.now().toString(),
        patientName: formData.patientName || '',
        patientPhone: formData.patientPhone || '',
        patientEmail: formData.patientEmail || '',
        date: formData.date || '',
        time: formData.time || '',
        type: formData.type || '',
        status: 'pending',
        notes: formData.notes || '',
      };
      setAppointments([...appointments, newAppointment]);
    } else if (modalMode === 'edit' && selectedAppointment) {
      setAppointments(
        appointments.map((apt) =>
          apt.id === selectedAppointment.id ? { ...apt, ...formData } : apt
        )
      );
    }
    closeModal();
  };

  const handleDelete = () => {
    if (selectedAppointment) {
      setAppointments(appointments.filter((apt) => apt.id !== selectedAppointment.id));
    }
    closeModal();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Gestion des Rendez-vous</h1>
          <p className="text-gray-600 mt-2">Gérez tous vos rendez-vous patients</p>
        </div>
        <button
          onClick={() => openModal('add')}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Nouveau Rendez-vous
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher par nom, téléphone ou email..."
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
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Patient</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Contact</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Date & Heure</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Type</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Statut</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map((appointment) => (
                  <tr key={appointment.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User size={20} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{appointment.patientName}</p>
                          <p className="text-xs text-gray-600">{appointment.type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-800 flex items-center gap-2">
                          <Phone size={14} />
                          {appointment.patientPhone}
                        </p>
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <Mail size={14} />
                          {appointment.patientEmail}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-800 flex items-center gap-2">
                          <Calendar size={14} />
                          {new Date(appointment.date).toLocaleDateString('fr-FR')}
                        </p>
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <Clock size={14} />
                          {appointment.time}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-800">{appointment.type}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                        {getStatusLabel(appointment.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openModal('edit', appointment)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => openModal('delete', appointment)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-600">
                    Aucun rendez-vous trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">
                {modalMode === 'add' && 'Nouveau Rendez-vous'}
                {modalMode === 'edit' && 'Modifier Rendez-vous'}
                {modalMode === 'delete' && 'Supprimer Rendez-vous'}
              </h2>
              <button onClick={closeModal} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {modalMode === 'delete' ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
                    <AlertCircle className="text-red-600" size={24} />
                    <div>
                      <p className="font-medium text-red-800">Êtes-vous sûr ?</p>
                      <p className="text-sm text-red-700">
                        Cette action ne peut pas être annulée
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-600">
                    Vous êtes sur le point de supprimer le rendez-vous de{' '}
                    <strong>{selectedAppointment?.patientName}</strong> le{' '}
                    <strong>{new Date(selectedAppointment?.date || '').toLocaleDateString('fr-FR')}</strong> à{' '}
                    <strong>{selectedAppointment?.time}</strong>.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom du Patient
                    </label>
                    <input
                      type="text"
                      value={formData.patientName || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, patientName: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nom complet"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={formData.patientPhone || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, patientPhone: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="+224 XXX XXX XXX"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.patientEmail || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, patientEmail: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="email@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={formData.date || ''}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Heure
                    </label>
                    <input
                      type="time"
                      value={formData.time || ''}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type de Consultation
                    </label>
                    <select
                      value={formData.type || ''}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Sélectionner un type</option>
                      <option value="Consultation Générale">Consultation Générale</option>
                      <option value="Suivi Post-Opératoire">Suivi Post-Opératoire</option>
                      <option value="Consultation Spécialisée">Consultation Spécialisée</option>
                      <option value="Urgence">Urgence</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={formData.notes || ''}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Notes supplémentaires..."
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              {modalMode === 'delete' ? (
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <Trash2 size={18} />
                  Supprimer
                </button>
              ) : (
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Check size={18} />
                  Enregistrer
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
