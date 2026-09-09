'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2, Stethoscope, Package, FlaskConical, MapPin, Phone, Mail,
  Clock, CheckCircle, ChevronRight, ChevronLeft, Check, Users,
} from 'lucide-react';

const LOCATIONS = [
  { group: 'Conakry — Communes', places: ['Kaloum', 'Dixinn', 'Matam', 'Ratoma', 'Matoto'] },
  { group: 'Basse-Guinée', places: ['Coyah', 'Dubréka', 'Forécariah', 'Boffa', 'Fria', 'Kindia', 'Télimélé', 'Kamsar', 'Boké'] },
  { group: 'Moyenne-Guinée', places: ['Labé', 'Mamou', 'Pita', 'Dalaba', 'Mali', 'Koubia', 'Lélouma', 'Tougué'] },
  { group: 'Haute-Guinée', places: ['Kankan', 'Siguiri', 'Kouroussa', 'Mandiana', 'Kérouané', 'Faranah', 'Kissidougou', 'Dinguiraye'] },
  { group: 'Guinée Forestière', places: ["N'Zérékoré", 'Guéckédou', 'Macenta', 'Yomou', 'Lola', 'Beyla', 'Sipilou'] },
];

const SPECIALTIES = [
  'Médecine générale', 'Cardiologie', 'Pédiatrie', 'Gynécologie', 'Chirurgie',
  'Dermatologie', 'Ophtalmologie', 'ORL', 'Neurologie', 'Orthopédie',
  'Pneumologie', 'Psychiatrie', 'Urologie', 'Gastroentérologie', 'Endocrinologie',
  'Rhumatologie', 'Anesthésie', 'Radiologie', 'Infectiologie', 'Médecine interne',
];

const SERVICES = [
  'Consultations', 'Urgences', 'Analyses biologiques', 'Imagerie médicale',
  'Chirurgie', 'Maternité', 'Pédiatrie', 'Vaccination', 'Soins infirmiers',
  'Kinésithérapie', 'Dialyse', 'Hospitalisation', 'Pharmacie interne',
];

const ANALYSES = [
  'Numération Formule Sanguine (NFS)', 'Glycémie', 'Bilan lipidique', 'Créatinine / Urée',
  'Transaminases (ALAT/ASAT)', 'Test VIH', 'Paludisme (TDR / Frottis)', 'Hépatites B et C',
  'Groupe sanguin / Rhésus', 'Protéines totales', 'Albumine sérique', 'CRP (Protéine C-réactive)',
  'ECBU (Examen Cytobactériologique des Urines)', 'Coproculture', 'Test de grossesse (β-hCG)',
  'TSH / T3 / T4 (Thyroïde)', 'PSA (Prostate)', 'Hémoglobine glyquée (HbA1c)',
  'Antibiogramme', 'Radiologie', 'Échographie', 'Électrocardiogramme (ECG)',
];

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

const TYPES = [
  {
    id: 'medecin_independant',
    label: 'Médecin Indépendant',
    desc: 'Praticien exerçant en libéral à titre individuel',
    icon: <Stethoscope className="w-7 h-7" />,
    color: 'blue',
    isPharmacy: false,
  },
  {
    id: 'cabinet',
    label: 'Cabinet Médical',
    desc: 'Un ou plusieurs médecins en pratique privée',
    icon: <Building2 className="w-7 h-7" />,
    color: 'indigo',
    isPharmacy: false,
  },
  {
    id: 'pharmacie',
    label: 'Pharmacie',
    desc: 'Officine de pharmacie avec livraison possible',
    icon: <Package className="w-7 h-7" />,
    color: 'emerald',
    isPharmacy: true,
  },
  {
    id: 'laboratoire',
    label: 'Laboratoire d\'analyses',
    desc: 'Laboratoire de biologie médicale et analyses',
    icon: <FlaskConical className="w-7 h-7" />,
    color: 'purple',
    isPharmacy: false,
  },
];

type Step = 1 | 2 | 3 | 4;

export default function CabinetNewPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [selectedType, setSelectedType] = useState('');
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedAnalyses, setSelectedAnalyses] = useState<string[]>([]);
  const [selectedDays, setSelectedDays] = useState<string[]>(['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi']);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    location: '',
    address: '',
    description: '',
    doctorCount: '1',
    openTime: '08:00',
    closeTime: '18:00',
    hasDelivery: false,
  });

  const isPharmacy = ['pharmacie', 'pharmacie_24h'].includes(selectedType);
  const isLaboratory = selectedType === 'laboratoire';
  const isOpen24h = selectedType === 'pharmacie_24h';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const toggleSpecialty = (s: string) =>
    setSelectedSpecialties(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const toggleService = (s: string) =>
    setSelectedServices(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const toggleAnalyse = (a: string) =>
    setSelectedAnalyses(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);

  const toggleDay = (d: string) =>
    setSelectedDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);

  const canNext = () => {
    if (step === 1) return !!selectedType;
    if (step === 2) return form.name.trim() && form.phone.trim() && form.location;
    if (step === 3) return true;
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/pro/cabinet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedType,
          name: form.name,
          phone: form.phone,
          email: form.email || undefined,
          location: form.location,
          address: form.address,
          description: form.description || undefined,
          specialties: (!isPharmacy && !isLaboratory) ? selectedSpecialties : undefined,
          doctorCount: (!isPharmacy && !isLaboratory) ? parseInt(form.doctorCount) : undefined,
          services: (!isPharmacy && !isLaboratory) ? selectedServices : undefined,
          analyses: isLaboratory ? selectedAnalyses : undefined,
          isOpen24h: isOpen24h,
          hasDelivery: isPharmacy ? form.hasDelivery : undefined,
          openTime: !isOpen24h ? form.openTime : undefined,
          closeTime: !isOpen24h ? form.closeTime : undefined,
          openDays: !isOpen24h ? selectedDays : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Erreur lors de la création.'); return; }
      router.push('/pro/cabinet');
    } catch {
      setError('Erreur de connexion au serveur.');
    } finally {
      setLoading(false);
    }
  };

  const stepLabels = ['Type', 'Informations', 'Détails', 'Confirmation'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Créer Votre Établissement</h1>
        <p className="text-gray-500 mt-1">Renseignez les informations de votre établissement de santé</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0">
        {stepLabels.map((label, i) => {
          const num = i + 1;
          const active = step === num;
          const done = step > num;
          return (
            <div key={label} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition ${
                  done ? 'bg-teal-600 text-white' : active ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {done ? <Check size={16} /> : num}
                </div>
                <span className={`text-xs mt-1 font-medium ${active ? 'text-blue-600' : done ? 'text-teal-600' : 'text-gray-400'}`}>
                  {label}
                </span>
              </div>
              {i < stepLabels.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 mb-4 ${done ? 'bg-teal-400' : 'bg-gray-200'}`} />
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow p-6">

        {/* STEP 1 — Type d'établissement */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-5">Quel type d'établissement souhaitez-vous créer ?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {TYPES.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedType(t.id)}
                  className={`flex items-start gap-4 p-5 rounded-xl border-2 text-left transition ${
                    selectedType === t.id
                      ? `border-${t.color}-600 bg-${t.color}-50`
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    selectedType === t.id ? `bg-${t.color}-100 text-${t.color}-600` : 'bg-gray-100 text-gray-500'
                  }`}>
                    {t.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-gray-900">{t.label}</p>
                      {selectedType === t.id && <Check size={18} className="text-teal-600" />}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{t.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2 — Informations générales */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-800 mb-2">Informations générales</h2>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Nom de l'établissement <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder={isPharmacy ? 'Pharmacie Centrale de Conakry' : 'Cabinet du Dr. Diallo'}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  <span className="flex items-center gap-1"><Phone size={13} /> Téléphone <span className="text-red-500">*</span></span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+224 6XX XXX XXX"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  <span className="flex items-center gap-1"><Mail size={13} /> Email (optionnel)</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="contact@monestablissement.gn"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                <span className="flex items-center gap-1"><MapPin size={13} /> Localisation <span className="text-red-500">*</span></span>
              </label>
              <select
                name="location"
                value={form.location}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition bg-white"
              >
                <option value="">-- Sélectionnez votre ville / commune --</option>
                {LOCATIONS.map(g => (
                  <optgroup key={g.group} label={g.group}>
                    {g.places.map(p => <option key={p} value={p}>{p}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>

            <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Adresse détaillée <span className="text-gray-400 font-normal text-xs">(optionnel)</span>
              </label>
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Rue, quartier, bâtiment..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Description / Présentation (optionnel)
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                placeholder="Décrivez votre établissement, votre équipe, vos services..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition resize-none"
              />
            </div>
          </div>
        )}

        {/* STEP 3 — Détails spécifiques */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-800 mb-2">
              {isPharmacy ? 'Informations de la pharmacie' : isLaboratory ? 'Analyses proposées et horaires' : 'Spécialités, services et horaires'}
            </h2>

            {/* LABORATOIRE */}
            {isLaboratory && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <span className="flex items-center gap-1.5"><FlaskConical size={14} /> Analyses et examens proposés</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ANALYSES.map(a => {
                    const sel = selectedAnalyses.includes(a);
                    return (
                      <button
                        key={a}
                        type="button"
                        onClick={() => toggleAnalyse(a)}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition text-left ${
                          sel ? 'bg-purple-600 text-white font-semibold' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <span>{a}</span>
                        {sel && <Check size={13} className="flex-shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CABINET / CLINIQUE */}
            {!isPharmacy && !isLaboratory && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    <span className="flex items-center gap-1.5"><Users size={14} /> Nombre de médecins</span>
                  </label>
                  <input
                    type="number"
                    name="doctorCount"
                    value={form.doctorCount}
                    onChange={handleChange}
                    min="1"
                    max="200"
                    className="w-32 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Spécialités pratiquées</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {SPECIALTIES.map(s => {
                      const sel = selectedSpecialties.includes(s);
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => toggleSpecialty(s)}
                          className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition ${
                            sel ? 'bg-blue-600 text-white font-semibold' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <span>{s}</span>
                          {sel && <Check size={13} />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Services disponibles</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {SERVICES.map(s => {
                      const sel = selectedServices.includes(s);
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => toggleService(s)}
                          className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition ${
                            sel ? 'bg-teal-600 text-white font-semibold' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <span>{s}</span>
                          {sel && <Check size={13} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* PHARMACIE */}
            {isPharmacy && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                  <Package className="text-emerald-600 flex-shrink-0" size={20} />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">Livraison à domicile</p>
                    <p className="text-sm text-gray-500">Proposez-vous la livraison de médicaments ?</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="hasDelivery"
                      checked={form.hasDelivery}
                      onChange={handleChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-emerald-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
                  </label>
                </div>

                {isOpen24h && (
                  <div className="flex items-center gap-3 p-4 bg-teal-50 rounded-xl border border-teal-200">
                    <Clock className="text-teal-600" size={20} />
                    <div>
                      <p className="font-semibold text-gray-800">Ouvert 24h/24 · 7j/7</p>
                      <p className="text-sm text-gray-500">Votre pharmacie est ouverte en permanence</p>
                    </div>
                    <Check className="ml-auto text-teal-600" size={20} />
                  </div>
                )}
              </div>
            )}

            {/* HORAIRES (communs sauf pharmacie_24h) */}
            {!isOpen24h && (
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-700">
                  <span className="flex items-center gap-1.5"><Clock size={14} /> Horaires d'ouverture</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Ouverture</label>
                    <input
                      type="time"
                      name="openTime"
                      value={form.openTime}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Fermeture</label>
                    <input
                      type="time"
                      name="closeTime"
                      value={form.closeTime}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-2">Jours d'ouverture</label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map(d => {
                      const sel = selectedDays.includes(d);
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => toggleDay(d)}
                          className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                            sel ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {d.slice(0, 3)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 4 — Confirmation */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Vérification avant création</h2>

            <div className="bg-gray-50 rounded-xl p-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Type</span>
                <span className="font-semibold text-gray-900">{TYPES.find(t => t.id === selectedType)?.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Nom</span>
                <span className="font-semibold text-gray-900">{form.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Téléphone</span>
                <span className="font-semibold text-gray-900">{form.phone}</span>
              </div>
              {form.email && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Email</span>
                  <span className="font-semibold text-gray-900">{form.email}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Localisation</span>
                <span className="font-semibold text-gray-900">{form.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Adresse</span>
                <span className="font-semibold text-gray-900 text-right max-w-xs">{form.address}</span>
              </div>
              {!isPharmacy && !isLaboratory && selectedSpecialties.length > 0 && (
                <div className="flex justify-between items-start">
                  <span className="text-gray-500">Spécialités</span>
                  <span className="font-semibold text-gray-900 text-right max-w-xs">{selectedSpecialties.join(', ')}</span>
                </div>
              )}
              {isLaboratory && selectedAnalyses.length > 0 && (
                <div className="flex justify-between items-start">
                  <span className="text-gray-500">Analyses</span>
                  <span className="font-semibold text-gray-900 text-right max-w-xs">{selectedAnalyses.length} analyse(s) sélectionnée(s)</span>
                </div>
              )}
              {isOpen24h ? (
                <div className="flex justify-between">
                  <span className="text-gray-500">Horaires</span>
                  <span className="font-semibold text-teal-700">24h/24 · 7j/7</span>
                </div>
              ) : (
                <div className="flex justify-between">
                  <span className="text-gray-500">Horaires</span>
                  <span className="font-semibold text-gray-900">{form.openTime} – {form.closeTime}</span>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{error}</div>
            )}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-8 pt-5 border-t border-gray-100">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((step - 1) as Step)}
              className="flex items-center gap-2 px-5 py-2.5 border-2 border-gray-200 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition"
            >
              <ChevronLeft size={18} /> Précédent
            </button>
          ) : <div />}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => { if (canNext()) setStep((step + 1) as Step); }}
              disabled={!canNext()}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold rounded-xl transition"
            >
              Suivant <ChevronRight size={18} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white font-bold rounded-xl transition"
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Création...</>
              ) : (
                <><CheckCircle size={18} /> Créer mon établissement</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
