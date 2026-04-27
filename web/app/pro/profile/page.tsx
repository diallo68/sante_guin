'use client';

import { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Edit, Save, X, Loader2, AlertCircle } from 'lucide-react';

interface DoctorProfile {
  _id: string;
  firstName: string;
  lastName: string;
  specialty: string;
  phone?: string;
  email?: string;
  city: string;
  address?: string;
  bio?: string;
  consultationFee?: number;
  languages: string[];
  isVerified: boolean;
}

export default function ProfilePage() {
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState<Partial<DoctorProfile>>({});

  useEffect(() => {
    fetch('/api/pro/profile')
      .then(r => r.json())
      .then(data => {
        if (data.doctor) {
          setDoctor(data.doctor);
          setFormData(data.doctor);
        } else {
          setError(data.error || 'Erreur lors du chargement');
        }
      })
      .catch(() => setError('Erreur réseau'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/pro/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        setDoctor(data.doctor);
        setIsEditing(false);
        setSuccess('Profil mis à jour avec succès');
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

  if (error && !doctor) {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg text-red-700">
        <AlertCircle size={20} />
        <p>{error}</p>
      </div>
    );
  }

  if (!doctor) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Profil Professionnel</h1>
          <p className="text-gray-600 mt-2">Gérez vos informations professionnelles</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => { setFormData(doctor); setIsEditing(true); }}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Edit size={20} />
            Modifier
          </button>
        )}
      </div>

      {success && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          <AlertCircle size={20} />
          <p>{success}</p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-8">
        <div className="flex items-center gap-6 mb-8 pb-8 border-b border-gray-200">
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="text-blue-600" size={48} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Dr. {doctor.firstName} {doctor.lastName}
            </h2>
            <p className="text-gray-600">{doctor.specialty}</p>
            <div className="flex gap-2 mt-2">
              {doctor.isVerified && (
                <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full">
                  ✓ Vérifié
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
            {isEditing ? (
              <input
                type="text"
                value={formData.firstName || ''}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-800">{doctor.firstName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
            {isEditing ? (
              <input
                type="text"
                value={formData.lastName || ''}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-800">{doctor.lastName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Mail size={16} /> Email
            </label>
            {isEditing ? (
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-800">{doctor.email || '—'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Phone size={16} /> Téléphone
            </label>
            {isEditing ? (
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-800">{doctor.phone || '—'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Spécialité</label>
            {isEditing ? (
              <input
                type="text"
                value={formData.specialty || ''}
                onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-800">{doctor.specialty}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tarif consultation (FG)</label>
            {isEditing ? (
              <input
                type="number"
                value={formData.consultationFee || ''}
                onChange={(e) => setFormData({ ...formData, consultationFee: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ex: 50000"
              />
            ) : (
              <p className="text-gray-800">
                {doctor.consultationFee ? `${doctor.consultationFee.toLocaleString('fr-FR')} FG` : '—'}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Biographie</label>
            {isEditing ? (
              <textarea
                value={formData.bio || ''}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Décrivez votre parcours et votre expérience..."
              />
            ) : (
              <p className="text-gray-800">{doctor.bio || '—'}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <MapPin size={20} /> Localisation
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ville</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.city || ''}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-800">{doctor.city}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Adresse détaillée (optionnel)"
                  />
                ) : (
                  <p className="text-gray-800">{doctor.address || '—'}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="flex items-center justify-end gap-3 mt-8 pt-8 border-t border-gray-200">
            <button
              onClick={() => { setIsEditing(false); setError(''); }}
              className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              disabled={saving}
            >
              <X size={18} />
              Annuler
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              disabled={saving}
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Enregistrer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
