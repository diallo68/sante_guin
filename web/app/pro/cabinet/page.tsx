'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2, MapPin, Phone, Mail, Clock, Users, Package,
  Star, Edit3, CheckCircle, AlertCircle, Calendar, Truck,
  Stethoscope, FlaskConical, ArrowRight, PlusCircle, Settings, BarChart3,
} from 'lucide-react';

interface BusinessProfile {
  _id: string;
  type: string;
  name: string;
  phone: string;
  email?: string;
  location: string;
  address: string;
  description?: string;
  specialties?: string[];
  doctorCount?: number;
  services?: string[];
  analyses?: string[];
  isOpen24h?: boolean;
  hasDelivery?: boolean;
  openTime?: string;
  closeTime?: string;
  openDays?: string[];
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  isActive: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  medecin_independant: 'Médecin Indépendant',
  cabinet: 'Cabinet Médical',
  clinique: 'Clinique / Centre de santé',
  centre_sante: 'Centre de santé',
  pharmacie: 'Pharmacie',
  pharmacie_24h: 'Pharmacie 24h/24',
  laboratoire: 'Laboratoire d\'analyses',
};

const TYPE_ICONS: Record<string, JSX.Element> = {
  medecin_independant: <Stethoscope className="w-6 h-6" />,
  cabinet: <Stethoscope className="w-6 h-6" />,
  clinique: <Building2 className="w-6 h-6" />,
  centre_sante: <Building2 className="w-6 h-6" />,
  pharmacie: <Package className="w-6 h-6" />,
  pharmacie_24h: <Package className="w-6 h-6" />,
  laboratoire: <FlaskConical className="w-6 h-6" />,
};

export default function CabinetDashboardPage() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editSection, setEditSection] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Editable fields state
  const [editForm, setEditForm] = useState<Partial<BusinessProfile>>({});

  useEffect(() => {
    fetch('/api/pro/cabinet')
      .then(r => r.json())
      .then(data => { setProfile(data.profile); setEditForm(data.profile || {}); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const isPharmacy = profile ? ['pharmacie', 'pharmacie_24h'].includes(profile.type) : false;
  const isLaboratory = profile?.type === 'laboratoire';

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const saveSection = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/pro/cabinet', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (res.ok) {
        setProfile(data.profile);
        setEditForm(data.profile);
        setEditSection(null);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch { /* silent */ }
    finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // No profile → invite to create
  if (!profile) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Cabinet / Pharmacie / Laboratoire</h1>
          <p className="text-gray-500 mt-1">Gérez votre établissement de santé</p>
        </div>
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Building2 className="w-10 h-10 text-blue-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Aucun établissement créé</h2>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            Vous n'avez pas encore créé votre cabinet, pharmacie ou laboratoire. Commencez maintenant pour apparaître sur Guinée Santé.
          </p>
          <Link
            href="/pro/cabinet/new"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition shadow-md"
          >
            <PlusCircle size={20} /> Créer mon Cabinet / Pharmacie / Laboratoire
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isPharmacy ? 'Ma Pharmacie' : isLaboratory ? 'Mon Laboratoire' : 'Mon Cabinet'}
          </h1>
          <p className="text-gray-500 mt-1">Gérez votre établissement de santé</p>
        </div>
        {saveSuccess && (
          <div className="flex items-center gap-2 bg-green-50 text-green-700 border border-green-200 px-4 py-2 rounded-xl text-sm font-semibold">
            <CheckCircle size={16} /> Modifications enregistrées
          </div>
        )}
      </div>

      {/* Identity card */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 flex-shrink-0">
            {TYPE_ICONS[profile.type] || <Building2 className="w-6 h-6" />}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold text-gray-900">{profile.name}</h2>
                  {profile.isVerified ? (
                    <span className="inline-flex items-center gap-1 bg-teal-100 text-teal-700 text-xs font-bold px-2 py-0.5 rounded-full">
                      <CheckCircle size={11} /> Vérifié
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-0.5 rounded-full">
                      <AlertCircle size={11} /> En attente de vérification
                    </span>
                  )}
                </div>
                <p className="text-blue-600 font-semibold text-sm">{TYPE_LABELS[profile.type]}</p>
              </div>
              <button
                onClick={() => setEditSection(editSection === 'identity' ? null : 'identity')}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 border border-gray-200 hover:border-blue-300 px-3 py-1.5 rounded-lg transition"
              >
                <Edit3 size={14} /> Modifier
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-sm text-gray-600">
              <div className="flex items-center gap-2"><MapPin size={14} className="text-gray-400" />{profile.location} · {profile.address}</div>
              <div className="flex items-center gap-2"><Phone size={14} className="text-gray-400" />{profile.phone}</div>
              {profile.email && <div className="flex items-center gap-2"><Mail size={14} className="text-gray-400" />{profile.email}</div>}
              {profile.rating > 0 && (
                <div className="flex items-center gap-2">
                  <Star size={14} className="text-yellow-400 fill-yellow-400" />
                  {profile.rating.toFixed(1)} · {profile.reviewCount} avis
                </div>
              )}
            </div>
            {profile.description && (
              <p className="text-sm text-gray-500 mt-3 leading-relaxed">{profile.description}</p>
            )}
          </div>
        </div>

        {/* Inline edit form — identity */}
        {editSection === 'identity' && (
          <div className="mt-6 pt-5 border-t border-gray-100 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nom de l'établissement</label>
                <input name="name" value={editForm.name || ''} onChange={handleEditChange}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Téléphone</label>
                <input name="phone" value={editForm.phone || ''} onChange={handleEditChange}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
                <input name="email" value={editForm.email || ''} onChange={handleEditChange}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Adresse</label>
                <input name="address" value={editForm.address || ''} onChange={handleEditChange}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
              <textarea name="description" value={editForm.description || ''} onChange={handleEditChange} rows={3}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm resize-none" />
            </div>
            <div className="flex gap-3">
              <button onClick={saveSection} disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-5 py-2 rounded-lg transition flex items-center gap-2">
                {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle size={15} />}
                Enregistrer
              </button>
              <button onClick={() => setEditSection(null)}
                className="border border-gray-200 text-gray-600 text-sm px-4 py-2 rounded-lg hover:bg-gray-50 transition">
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Note moyenne', value: profile.rating > 0 ? `${profile.rating.toFixed(1)}/5` : '—', sub: `${profile.reviewCount} avis`, icon: <Star className="w-5 h-5" />, color: 'yellow' },
          { label: isPharmacy ? 'Commandes du mois' : isLaboratory ? 'Analyses proposées' : 'RDV ce mois', value: isLaboratory ? (profile.analyses?.length ?? 0) : '—', sub: isLaboratory ? 'types d\'analyses' : 'données à venir', icon: isLaboratory ? <FlaskConical className="w-5 h-5" /> : <Calendar className="w-5 h-5" />, color: 'blue' },
          { label: isPharmacy ? 'Livraisons en cours' : isLaboratory ? 'Statut' : 'En attente', value: isLaboratory ? (profile.isActive ? 'Actif' : 'Inactif') : '—', sub: isLaboratory ? 'établissement' : 'à traiter', icon: isPharmacy ? <Truck className="w-5 h-5" /> : isLaboratory ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />, color: isLaboratory ? 'teal' : 'orange' },
          { label: isPharmacy ? 'Produits listés' : isLaboratory ? 'Vérification' : 'Médecins', value: isPharmacy ? '—' : isLaboratory ? (profile.isVerified ? 'Vérifié' : 'En attente') : profile.doctorCount ?? '—', sub: isPharmacy ? 'dans votre officine' : isLaboratory ? 'statut du profil' : 'dans votre cabinet', icon: isPharmacy ? <Package className="w-5 h-5" /> : isLaboratory ? <CheckCircle className="w-5 h-5" /> : <Users className="w-5 h-5" />, color: isLaboratory ? 'purple' : 'teal' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl shadow p-5">
            <div className={`w-9 h-9 bg-${s.color}-100 text-${s.color}-600 rounded-lg flex items-center justify-center mb-3`}>
              {s.icon}
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs font-semibold text-gray-600 mt-0.5">{s.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Horaires & Activité */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2"><Clock size={16} /> Horaires</h3>
            <button onClick={() => setEditSection(editSection === 'hours' ? null : 'hours')}
              className="text-xs text-blue-600 hover:underline flex items-center gap-1"><Edit3 size={12} /> Modifier</button>
          </div>

          {editSection === 'hours' ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Ouverture</label>
                  <input type="time" name="openTime" value={editForm.openTime || '08:00'} onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Fermeture</label>
                  <input type="time" name="closeTime" value={editForm.closeTime || '18:00'} onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={saveSection} disabled={saving}
                  className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-lg">{saving ? '...' : 'Enregistrer'}</button>
                <button onClick={() => setEditSection(null)} className="text-xs text-gray-500 px-3 py-2 border rounded-lg">Annuler</button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              {profile.isOpen24h ? (
                <div className="flex items-center gap-2 text-teal-700 font-semibold">
                  <CheckCircle size={15} /> Ouvert 24h/24 · 7j/7
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-gray-600">
                    <span>Heures</span>
                    <span className="font-semibold">{profile.openTime || '—'} – {profile.closeTime || '—'}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Jours</span>
                    <span className="font-semibold text-right">{profile.openDays?.map(d => d.slice(0,3)).join(', ') || '—'}</span>
                  </div>
                </>
              )}
              {isPharmacy && (
                <div className="flex justify-between text-gray-600 pt-2 border-t border-gray-100">
                  <span>Livraison</span>
                  <span className={`font-semibold ${profile.hasDelivery ? 'text-emerald-600' : 'text-gray-400'}`}>
                    {profile.hasDelivery ? '✓ Disponible' : 'Non disponible'}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Spécialités / Services / Analyses */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              {isPharmacy ? <><Package size={16} /> Services</> : isLaboratory ? <><FlaskConical size={16} /> Analyses</> : <><Stethoscope size={16} /> Spécialités</>}
            </h3>
          </div>
          {!isPharmacy && !isLaboratory && (
            <>
              {profile.specialties && profile.specialties.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {profile.specialties.map(s => (
                    <span key={s} className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-blue-100">{s}</span>
                  ))}
                </div>
              ) : <p className="text-sm text-gray-400 mb-3">Aucune spécialité renseignée</p>}
              {profile.services && profile.services.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-400 font-semibold uppercase mb-2">Services</p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.services.map(s => (
                      <span key={s} className="bg-teal-50 text-teal-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-teal-100">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
          {isPharmacy && (
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Package size={14} className="text-gray-400" /> Médicaments sur ordonnance
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Package size={14} className="text-gray-400" /> Produits parapharmaceutiques
              </div>
              {profile.hasDelivery && (
                <div className="flex items-center gap-2 text-emerald-600 font-semibold">
                  <Truck size={14} /> Livraison à domicile
                </div>
              )}
            </div>
          )}
          {isLaboratory && (
            <>
              {profile.analyses && profile.analyses.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {profile.analyses.map(a => (
                    <span key={a} className="bg-purple-50 text-purple-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-purple-100">{a}</span>
                  ))}
                </div>
              ) : <p className="text-sm text-gray-400">Aucune analyse renseignée</p>}
            </>
          )}
          <Link href="/pro/cabinet/new"
            className="mt-4 flex items-center gap-1 text-xs text-blue-600 hover:underline">
            <Edit3 size={11} /> Modifier les informations
          </Link>
        </div>

        {/* Actions rapides */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Settings size={16} /> Actions</h3>
          <div className="space-y-2">
            {[
              { href: '/pro/appointments', label: isPharmacy ? 'Commandes / Demandes' : 'Gérer les RDV', icon: <Calendar size={15} />, color: 'blue' },
              { href: '/pro/documents', label: isPharmacy ? 'Documents officiels' : 'Dossiers médicaux', icon: <BarChart3 size={15} />, color: 'indigo' },
              { href: '/pro/schedule', label: 'Modifier les horaires', icon: <Clock size={15} />, color: 'teal' },
              { href: '/pro/profile', label: 'Profil du responsable', icon: <Users size={15} />, color: 'gray' },
              { href: '/pro/reviews', label: 'Avis & évaluations', icon: <Star size={15} />, color: 'yellow' },
            ].map(item => (
              <Link key={item.href} href={item.href}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition group">
                <span className="flex items-center gap-2 text-sm font-medium text-gray-700 group-hover:text-blue-700">
                  {item.icon} {item.label}
                </span>
                <ArrowRight size={14} className="text-gray-400 group-hover:text-blue-500 transition" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
