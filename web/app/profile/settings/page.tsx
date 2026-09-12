'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Save, Loader2, AlertCircle, CheckCircle, Eye, EyeOff, Trash2, UserCog } from 'lucide-react';

// La carte "Paramètres" de /profile pointait vers /profile/settings, qui
// n'existait pas (404) — signalé par l'utilisateur. Le changement de mot de
// passe (/api/auth/change-password) et la demande de suppression de compte
// (/delete-account) existaient déjà côté backend/pages mais n'étaient
// reliés nulle part dans l'interface : cette page les rend accessibles.
export default function ProfileSettingsPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => { if (r.status === 401) { router.push('/auth/login'); return; } setCheckingAuth(false); })
      .catch(() => setCheckingAuth(false));
  }, [router]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    if (!currentPassword || !newPassword) { setError('Tous les champs sont requis'); return; }
    if (newPassword.length < 8) { setError('Le nouveau mot de passe doit contenir au moins 8 caractères'); return; }
    if (newPassword !== confirmPassword) { setError('Les mots de passe ne correspondent pas'); return; }

    setSaving(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Erreur lors du changement de mot de passe'); return; }
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setError('Erreur réseau');
    } finally {
      setSaving(false);
    }
  };

  if (checkingAuth) {
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

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>

        {/* Infos personnelles */}
        <Link
          href="/profile/edit"
          className="bg-white rounded-2xl shadow-md p-5 flex items-center gap-4 hover:shadow-lg transition-all"
        >
          <UserCog className="w-6 h-6 text-blue-600 flex-shrink-0" />
          <div>
            <p className="font-bold text-gray-900">Informations personnelles</p>
            <p className="text-sm text-gray-500">Prénom, nom, téléphone</p>
          </div>
        </Link>

        {/* Mot de passe */}
        <div className="bg-white rounded-2xl shadow-md p-6 sm:p-8">
          <h2 className="font-bold text-gray-900 mb-1">Changer de mot de passe</h2>
          <p className="text-sm text-gray-500 mb-5">Vous resterez connecté sur cet appareil.</p>

          {success && (
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl mb-4 text-green-700 text-sm">
              <CheckCircle size={18} />
              <p className="font-semibold">Mot de passe modifié avec succès.</p>
            </div>
          )}
          {error && (
            <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl mb-4 text-red-700 text-sm">
              <AlertCircle size={18} />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Mot de passe actuel</label>
              <div className="flex items-center border-2 border-gray-200 focus-within:border-blue-500 rounded-xl overflow-hidden">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="flex-1 px-4 py-2.5 outline-none"
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="px-3 text-gray-400">
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nouveau mot de passe</label>
                <div className="flex items-center border-2 border-gray-200 focus-within:border-blue-500 rounded-xl overflow-hidden">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="flex-1 px-4 py-2.5 outline-none min-w-0"
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)} className="px-3 text-gray-400 flex-shrink-0">
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Confirmer</label>
                <input
                  type={showNew ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 focus:border-blue-500 rounded-xl outline-none"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl transition"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Enregistrer
              </button>
            </div>
          </form>
        </div>

        {/* Zone dangereuse */}
        <Link
          href="/delete-account"
          className="bg-white rounded-2xl shadow-md p-5 flex items-center gap-4 hover:shadow-lg hover:border-red-200 border border-transparent transition-all"
        >
          <Trash2 className="w-6 h-6 text-red-500 flex-shrink-0" />
          <div>
            <p className="font-bold text-gray-900">Supprimer mon compte</p>
            <p className="text-sm text-gray-500">Demande de suppression définitive de vos données</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
