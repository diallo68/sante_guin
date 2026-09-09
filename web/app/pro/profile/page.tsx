'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Mail, Phone, MapPin, Edit, Save, X, Loader2, AlertCircle, Camera, CheckCircle } from 'lucide-react';

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
  photo?: string;
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

  // Photo upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState('');

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

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoError('');

    if (!file.type.startsWith('image/')) {
      setPhotoError('Seules les images sont acceptées (JPG, PNG, WebP)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('La photo ne doit pas dépasser 5 Mo');
      return;
    }

    // Prévisualisation locale
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handlePhotoUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    setPhotoError('');

    try {
      const form = new FormData();
      form.append('photo', file);

      const res = await fetch('/api/pro/upload-photo', { method: 'POST', body: form });
      const data = await res.json();

      if (res.ok) {
        setDoctor(prev => prev ? { ...prev, photo: data.photoUrl } : prev);
        setPhotoPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setSuccess('Photo mise à jour avec succès');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setPhotoError(data.error || 'Erreur lors de l\'upload');
      }
    } catch {
      setPhotoError('Erreur réseau');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const cancelPhotoPreview = () => {
    setPhotoPreview(null);
    setPhotoError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (error && !doctor) {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl text-red-700">
        <AlertCircle size={20} />
        <p>{error}</p>
      </div>
    );
  }

  if (!doctor) return null;

  const currentPhoto = photoPreview || doctor.photo;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profil Professionnel</h1>
          <p className="text-gray-500 mt-1">Gérez vos informations professionnelles</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => { setFormData(doctor); setIsEditing(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition text-sm"
          >
            <Edit size={16} /> Modifier
          </button>
        )}
      </div>

      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium">
          <CheckCircle size={16} /> {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Carte identité avec photo */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-6">

          {/* Avatar / Photo */}
          <div className="relative flex-shrink-0">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-teal-100 flex items-center justify-center border-4 border-white shadow-md">
              {currentPhoto ? (
                <Image
                  src={currentPhoto}
                  alt="Photo de profil"
                  width={96}
                  height={96}
                  className="object-cover w-full h-full"
                  unoptimized={!!photoPreview}
                />
              ) : (
                <span className="text-2xl font-bold text-teal-600">
                  {doctor.firstName[0]}{doctor.lastName[0]}
                </span>
              )}
            </div>

            {/* Bouton caméra */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-8 h-8 bg-teal-600 hover:bg-teal-700 text-white rounded-full flex items-center justify-center shadow-md transition"
              title="Changer la photo"
            >
              <Camera size={14} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handlePhotoSelect}
            />
          </div>

          {/* Infos */}
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">
              Dr. {doctor.firstName} {doctor.lastName}
            </h2>
            <p className="text-teal-600 font-medium text-sm mt-0.5">{doctor.specialty}</p>
            <div className="flex gap-2 mt-2">
              {doctor.isVerified && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                  <CheckCircle size={11} /> Vérifié
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Prévisualisation + confirmation upload */}
        {photoPreview && (
          <div className="mt-4 p-4 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between gap-4">
            <p className="text-sm text-teal-700 font-medium">Nouvelle photo sélectionnée — confirmer l'upload ?</p>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={cancelPhotoPreview}
                disabled={uploadingPhoto}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition disabled:opacity-40"
              >
                Annuler
              </button>
              <button
                onClick={handlePhotoUpload}
                disabled={uploadingPhoto}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-60"
              >
                {uploadingPhoto ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                {uploadingPhoto ? 'Upload...' : 'Enregistrer la photo'}
              </button>
            </div>
          </div>
        )}

        {photoError && (
          <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5">
            <AlertCircle size={14} /> {photoError}
          </p>
        )}
        {!photoPreview && (
          <p className="mt-3 text-xs text-gray-400">
            Formats acceptés : JPG, PNG, WebP · Taille max : 5 Mo
          </p>
        )}
      </div>

      {/* Formulaire */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Prénom</label>
            {isEditing ? (
              <input type="text" value={formData.firstName || ''} onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 text-sm transition" />
            ) : (
              <p className="text-gray-800 text-sm py-2">{doctor.firstName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nom</label>
            {isEditing ? (
              <input type="text" value={formData.lastName || ''} onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 text-sm transition" />
            ) : (
              <p className="text-gray-800 text-sm py-2">{doctor.lastName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5"><Mail size={13} /> Email</label>
            {isEditing ? (
              <input type="email" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 text-sm transition" />
            ) : (
              <p className="text-gray-800 text-sm py-2">{doctor.email || '—'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5"><Phone size={13} /> Téléphone</label>
            {isEditing ? (
              <input type="tel" value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 text-sm transition" />
            ) : (
              <p className="text-gray-800 text-sm py-2">{doctor.phone || '—'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Spécialité</label>
            {isEditing ? (
              <input type="text" value={formData.specialty || ''} onChange={e => setFormData({ ...formData, specialty: e.target.value })}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 text-sm transition" />
            ) : (
              <p className="text-gray-800 text-sm py-2">{doctor.specialty}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tarif consultation (GNF)</label>
            {isEditing ? (
              <input type="number" value={formData.consultationFee || ''} onChange={e => setFormData({ ...formData, consultationFee: Number(e.target.value) })}
                placeholder="ex: 50000"
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 text-sm transition" />
            ) : (
              <p className="text-gray-800 text-sm py-2">
                {doctor.consultationFee ? `${doctor.consultationFee.toLocaleString('fr-FR')} GNF` : '—'}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Biographie</label>
            {isEditing ? (
              <textarea value={formData.bio || ''} onChange={e => setFormData({ ...formData, bio: e.target.value })} rows={4}
                placeholder="Décrivez votre parcours, votre expérience..."
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 text-sm transition resize-none" />
            ) : (
              <p className="text-gray-800 text-sm py-2 leading-relaxed">{doctor.bio || '—'}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5"><MapPin size={14} /> Localisation</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Ville</label>
                {isEditing ? (
                  <input type="text" value={formData.city || ''} onChange={e => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 text-sm transition" />
                ) : (
                  <p className="text-gray-800 text-sm py-2">{doctor.city}</p>
                )}
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Adresse</label>
                {isEditing ? (
                  <input type="text" value={formData.address || ''} onChange={e => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Adresse détaillée (optionnel)"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 text-sm transition" />
                ) : (
                  <p className="text-gray-800 text-sm py-2">{doctor.address || '—'}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="flex items-center justify-end gap-3 mt-6 pt-5 border-t border-gray-100">
            <button onClick={() => { setIsEditing(false); setError(''); }} disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition text-sm disabled:opacity-40">
              <X size={15} /> Annuler
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition text-sm disabled:opacity-60">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              Enregistrer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
