'use client';

import { useState, useEffect } from 'react';
import {
  User, Mail, Phone, ShieldCheck, Save, Lock,
  CheckCircle, AlertCircle, Eye, EyeOff, Loader2,
} from 'lucide-react';

interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  role: string;
  isVerified: boolean;
}

export default function AdminProfilPage() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Infos form
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [infoSaving, setInfoSaving] = useState(false);
  const [infoMsg, setInfoMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.user) {
          setUser(data.user);
          setFirstName(data.user.firstName);
          setLastName(data.user.lastName);
          setPhone(data.user.phone || '');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleInfoSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setInfoMsg(null);
    if (!firstName.trim() || !lastName.trim()) {
      setInfoMsg({ type: 'error', text: 'Prénom et nom sont requis.' });
      return;
    }
    setInfoSaving(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName: firstName.trim(), lastName: lastName.trim(), phone: phone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      setUser(data.user);
      setInfoMsg({ type: 'success', text: 'Profil mis à jour avec succès.' });
    } catch (err: any) {
      setInfoMsg({ type: 'error', text: err.message });
    } finally {
      setInfoSaving(false);
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg(null);
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwdMsg({ type: 'error', text: 'Tous les champs sont requis.' });
      return;
    }
    if (newPassword.length < 8) {
      setPwdMsg({ type: 'error', text: 'Le nouveau mot de passe doit contenir au moins 8 caractères.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdMsg({ type: 'error', text: 'Les mots de passe ne correspondent pas.' });
      return;
    }
    setPwdSaving(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      setPwdMsg({ type: 'success', text: 'Mot de passe modifié avec succès.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPwdMsg({ type: 'error', text: err.message });
    } finally {
      setPwdSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Mon Profil</h2>
        <p className="text-gray-500 text-sm mt-1">Gérez vos informations personnelles et votre sécurité</p>
      </div>

      {/* Carte identité */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 bg-teal-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
            {user.firstName[0]}{user.lastName[0]}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{user.firstName} {user.lastName}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2.5 py-1 bg-teal-100 text-teal-700 text-xs font-bold rounded-full flex items-center gap-1">
                <ShieldCheck size={11} /> Administrateur
              </span>
              {user.isVerified && (
                <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1">
                  <CheckCircle size={11} /> Vérifié
                </span>
              )}
            </div>
            <div className="mt-2 space-y-1">
              {user.email && (
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <Mail size={13} className="text-gray-400" /> {user.email}
                </p>
              )}
              {user.phone && (
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <Phone size={13} className="text-gray-400" /> {user.phone}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Formulaire infos */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
          <User size={18} className="text-teal-600" /> Informations personnelles
        </h3>

        {infoMsg && (
          <div className={`flex items-center gap-2 p-3 rounded-xl mb-5 text-sm font-medium ${
            infoMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {infoMsg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {infoMsg.text}
          </div>
        )}

        <form onSubmit={handleInfoSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Prénom</label>
              <input
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 text-gray-900 transition"
                placeholder="Prénom"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nom</label>
              <input
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 text-gray-900 transition"
                placeholder="Nom"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={user.email || ''}
                disabled
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-100 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">L'adresse email ne peut pas être modifiée.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Téléphone</label>
            <div className="relative">
              <Phone className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 text-gray-900 transition"
                placeholder="+224 6XX XX XX XX"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={infoSaving}
              className="flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition disabled:opacity-60"
            >
              {infoSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Enregistrer
            </button>
          </div>
        </form>
      </div>

      {/* Formulaire mot de passe */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
          <Lock size={18} className="text-teal-600" /> Changer le mot de passe
        </h3>

        {pwdMsg && (
          <div className={`flex items-center gap-2 p-3 rounded-xl mb-5 text-sm font-medium ${
            pwdMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {pwdMsg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {pwdMsg.text}
          </div>
        )}

        <form onSubmit={handlePasswordSave} className="space-y-4">
          {[
            { label: 'Mot de passe actuel', value: currentPassword, set: setCurrentPassword, show: showCurrent, toggle: () => setShowCurrent(v => !v) },
            { label: 'Nouveau mot de passe', value: newPassword, set: setNewPassword, show: showNew, toggle: () => setShowNew(v => !v) },
            { label: 'Confirmer le nouveau mot de passe', value: confirmPassword, set: setConfirmPassword, show: showConfirm, toggle: () => setShowConfirm(v => !v) },
          ].map(({ label, value, set, show, toggle }) => (
            <div key={label}>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
                <input
                  type={show ? 'text' : 'password'}
                  value={value}
                  onChange={e => set(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 text-gray-900 transition"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={toggle}
                  className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600"
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          ))}

          <p className="text-xs text-gray-400">Minimum 8 caractères.</p>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={pwdSaving}
              className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl transition disabled:opacity-60"
            >
              {pwdSaving ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
              Modifier le mot de passe
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
