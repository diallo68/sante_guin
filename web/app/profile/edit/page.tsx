'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Save, X, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

export default function ProfileEditPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => {
        if (r.status === 401) { router.push('/auth/login'); return null; }
        return r.json();
      })
      .then(data => {
        if (data?.user) {
          setForm({
            firstName: data.user.firstName || '',
            lastName: data.user.lastName || '',
            phone: data.user.phone || '',
          });
        }
      })
      .catch(() => setError('Erreur réseau'))
      .finally(() => setLoading(false));
  }, [router]);

  const handleSave = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('Prénom et nom sont requis');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push('/profile'), 1200);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4">
          <Link href="/profile" className="text-blue-600 hover:text-blue-700 font-semibold">
            ← Retour au profil
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Modifier mon profil</h1>

        {success && (
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl mb-6 text-green-700">
            <CheckCircle size={20} />
            <p className="font-semibold">Profil mis à jour ! Redirection...</p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl mb-6 text-red-700">
            <AlertCircle size={20} />
            <p>{error}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-md p-8 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Prénom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.firstName}
                onChange={e => setForm({ ...form, firstName: e.target.value })}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                placeholder="Votre prénom"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.lastName}
                onChange={e => setForm({ ...form, lastName: e.target.value })}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                placeholder="Votre nom"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Téléphone <span className="text-gray-400 font-normal">(optionnel)</span>
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
              placeholder="+224 6XX XXX XXX"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <Link
              href="/profile"
              className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition"
            >
              <X size={16} /> Annuler
            </Link>
            <button
              onClick={handleSave}
              disabled={saving || success}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition disabled:opacity-50"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
