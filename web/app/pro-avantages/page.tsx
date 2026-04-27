'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Calendar, FileText, BarChart3, MessageSquare,
  Shield, Zap, Check, X, Phone, Mail, User, Send, Stethoscope, MapPin,
  Package, PlusCircle, Settings,
} from 'lucide-react';

const PLANS = [
  {
    id: 'essentiel',
    name: 'Essentiel',
    tagline: 'Démarrez sans engagement',
    price: '50 000',
    unit: 'FG / mois',
    billing: 'Facturé mensuellement',
    discount: null,
    highlight: false,
    color: 'blue',
    features: [
      { label: 'Agenda en ligne', included: true },
      { label: 'Gestion des rendez-vous', included: true },
      { label: 'Profil médecin visible', included: true },
      { label: 'Notifications SMS patients', included: true },
      { label: 'Dossiers patients numériques', included: false },
      { label: 'Messagerie sécurisée', included: false },
      { label: 'Statistiques avancées', included: false },
      { label: 'Badge Pro vérifié', included: false },
      { label: 'Support prioritaire 7j/7', included: false },
    ],
  },
  {
    id: 'confort',
    name: 'Confort',
    tagline: 'Le choix des praticiens actifs',
    price: '135 000',
    unit: 'FG / trimestre',
    billing: '45 000 FG/mois · −10%',
    discount: '−10%',
    highlight: false,
    color: 'teal',
    features: [
      { label: 'Agenda en ligne', included: true },
      { label: 'Gestion des rendez-vous', included: true },
      { label: 'Profil médecin visible', included: true },
      { label: 'Notifications SMS patients', included: true },
      { label: 'Dossiers patients numériques', included: true },
      { label: 'Messagerie sécurisée', included: true },
      { label: 'Statistiques avancées', included: false },
      { label: 'Badge Pro vérifié', included: false },
      { label: 'Support prioritaire 7j/7', included: false },
    ],
  },
  {
    id: 'excellence',
    name: 'Excellence',
    tagline: 'Tout inclus, le meilleur tarif',
    price: '480 000',
    unit: 'FG / an',
    billing: '40 000 FG/mois · −20%',
    discount: '−20%',
    highlight: true,
    color: 'teal',
    features: [
      { label: 'Agenda en ligne', included: true },
      { label: 'Gestion des rendez-vous', included: true },
      { label: 'Profil médecin visible', included: true },
      { label: 'Notifications SMS patients', included: true },
      { label: 'Dossiers patients numériques', included: true },
      { label: 'Messagerie sécurisée', included: true },
      { label: 'Statistiques avancées', included: true },
      { label: 'Badge Pro vérifié', included: true },
      { label: 'Support prioritaire 7j/7', included: true },
    ],
  },
];

const INCLUDED_FEATURES = [
  { icon: <Calendar className="w-5 h-5 text-teal-600" />, title: 'Agenda en ligne', desc: 'Gérez vos créneaux et rendez-vous en temps réel, accessible 24h/24.' },
  { icon: <FileText className="w-5 h-5 text-teal-600" />, title: 'Dossiers patients', desc: 'Ordonnances, documents et historique médical centralisés et sécurisés.' },
  { icon: <BarChart3 className="w-5 h-5 text-teal-600" />, title: 'Statistiques', desc: 'Tableau de bord complet : consultations, revenus, taux de fidélisation.' },
  { icon: <MessageSquare className="w-5 h-5 text-teal-600" />, title: 'Messagerie sécurisée', desc: 'Communiquez directement avec vos patients en toute confidentialité.' },
  { icon: <Shield className="w-5 h-5 text-teal-600" />, title: 'Profil vérifié', desc: 'Badge Pro et mise en avant dans les résultats de recherche.' },
  { icon: <Zap className="w-5 h-5 text-teal-600" />, title: 'Rappels automatiques', desc: 'SMS envoyés automatiquement aux patients avant chaque rendez-vous.' },
  { icon: <Package className="w-5 h-5 text-teal-600" />, title: 'Gestion Pharmacie', desc: 'Gérez votre stock, horaires et livraisons depuis votre espace Pro.' },
];

interface ModalState {
  open: boolean;
  planName: string;
}

export default function ProAvantagesPage() {
  const [modal, setModal] = useState<ModalState>({ open: false, planName: '' });
  const [form, setForm] = useState({ nom: '', telephone: '', email: '', localisation: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const openModal = (planName: string) => {
    setForm({
      nom: '',
      telephone: '',
      email: '',
      localisation: '',
      message: `Bonjour, je suis intéressé(e) par l'offre ${planName} de Guinée Santé Pro. Je souhaite obtenir plus d'informations et procéder à la souscription.`,
    });
    setSent(false);
    setModal({ open: true, planName });
  };

  const closeModal = () => setModal({ open: false, planName: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    // Simulate sending (replace with real API call later)
    await new Promise(r => setTimeout(r, 1200));
    setSending(false);
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-teal-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link href="/" className="inline-flex items-center gap-2 text-teal-300 hover:text-white text-sm mb-6 transition">
            <ArrowLeft size={16} /> Retour à l'accueil
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-teal-500 bg-opacity-30 rounded-2xl flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-teal-300" />
            </div>
            <div>
              <span className="text-teal-400 text-xs font-bold uppercase tracking-widest">Pour les professionnels de santé</span>
              <h1 className="text-3xl md:text-4xl font-bold">Guinée Santé <span className="text-teal-400">Pro</span></h1>
            </div>
          </div>
          <p className="text-gray-300 text-lg max-w-2xl mb-4">
            Développez votre pratique médicale avec des outils pensés pour les professionnels de santé en Guinée — médecins, cabinets médicaux et pharmacies.
          </p>
          <div className="flex flex-wrap gap-2 mb-8">
            {['Médecins', 'Cabinets médicaux', 'Cliniques', 'Pharmacies', 'Centres de santé'].map(t => (
              <span key={t} className="bg-teal-700 bg-opacity-50 text-teal-200 text-xs font-semibold px-3 py-1.5 rounded-full border border-teal-600">
                {t}
              </span>
            ))}
          </div>
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/pro/cabinet/new"
              className="inline-flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-400 text-white font-bold py-3 px-6 rounded-xl transition shadow-lg"
            >
              <PlusCircle size={18} /> Créer votre Cabinet / Pharmacie
            </Link>
            <Link
              href="/pro/cabinet"
              className="inline-flex items-center justify-center gap-2 bg-white bg-opacity-15 hover:bg-opacity-25 text-white font-bold py-3 px-6 rounded-xl transition border border-white border-opacity-30"
            >
              <Settings size={18} /> Gérer Votre Cabinet / Boutique
            </Link>
          </div>
        </div>
      </div>

      {/* Features overview */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Tout ce dont vous avez besoin</h2>
          <p className="text-gray-500">Des fonctionnalités conçues pour simplifier votre quotidien</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {INCLUDED_FEATURES.map((feat, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-teal-200 transition">
              <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center mb-4">
                {feat.icon}
              </div>
              <h3 className="font-bold text-gray-900 mb-1">{feat.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing plans */}
      <section className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Choisissez votre offre</h2>
            <p className="text-gray-500">Paiement via Wave Money ou Orange Money · Annulation à tout moment</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map(plan => (
              <div
                key={plan.id}
                className={`relative rounded-2xl border-2 flex flex-col ${
                  plan.highlight
                    ? 'border-teal-600 shadow-xl shadow-teal-100'
                    : 'border-gray-200 shadow-sm'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-teal-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md">
                      ⭐ Meilleure offre
                    </span>
                  </div>
                )}

                <div className={`p-7 ${plan.highlight ? 'bg-gradient-to-br from-teal-50 to-cyan-50' : 'bg-white'} rounded-t-2xl`}>
                  {plan.discount && (
                    <span className="inline-block bg-teal-100 text-teal-700 text-xs font-bold px-2.5 py-1 rounded-full mb-3">
                      {plan.discount}
                    </span>
                  )}
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <p className="text-gray-500 text-sm mt-1 mb-5">{plan.tagline}</p>
                  <div className="mb-1">
                    <span className={`text-3xl font-bold ${plan.highlight ? 'text-teal-700' : 'text-gray-900'}`}>
                      {plan.price}
                    </span>
                    <span className="text-gray-400 text-sm ml-1">{plan.unit}</span>
                  </div>
                  <p className="text-xs text-teal-600 font-semibold">{plan.billing}</p>
                </div>

                <div className="p-7 flex-1 flex flex-col bg-white rounded-b-2xl">
                  <ul className="space-y-3 flex-1 mb-7">
                    {plan.features.map((feat, i) => (
                      <li key={i} className="flex items-center gap-3">
                        {feat.included ? (
                          <Check size={16} className="text-teal-600 flex-shrink-0" />
                        ) : (
                          <X size={16} className="text-gray-300 flex-shrink-0" />
                        )}
                        <span className={`text-sm ${feat.included ? 'text-gray-700' : 'text-gray-400'}`}>
                          {feat.label}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => openModal(plan.name)}
                    className={`w-full py-3 px-5 rounded-xl font-bold text-sm transition ${
                      plan.highlight
                        ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-md'
                        : 'bg-gray-900 hover:bg-gray-800 text-white'
                    }`}
                  >
                    Nous Contacter pour Souscrire
                  </button>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-gray-400 mt-8">
            Des questions ? Appelez-nous au <span className="font-semibold text-gray-600">+224 620 000 000</span> · Lun–Sam 8h–18h
          </p>
        </div>
      </section>

      {/* Modal */}
      {modal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <p className="text-xs text-teal-600 font-bold uppercase tracking-wider">Offre {modal.planName}</p>
                <h2 className="text-xl font-bold text-gray-900">Nous Contacter</h2>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition">
                <X size={22} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {sent ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Message envoyé !</h3>
                  <p className="text-gray-500 mb-6">Notre équipe vous contactera dans les plus brefs délais.</p>
                  <button
                    onClick={closeModal}
                    className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-8 rounded-xl transition"
                  >
                    Fermer
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      <span className="flex items-center gap-1.5"><User size={14} /> Nom complet</span>
                    </label>
                    <input
                      type="text"
                      name="nom"
                      value={form.nom}
                      onChange={handleChange}
                      required
                      placeholder="Dr. Mohamed Diallo"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      <span className="flex items-center gap-1.5"><Phone size={14} /> Téléphone</span>
                    </label>
                    <input
                      type="tel"
                      name="telephone"
                      value={form.telephone}
                      onChange={handleChange}
                      required
                      placeholder="+224 6XX XXX XXX"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      <span className="flex items-center gap-1.5"><Mail size={14} /> Email</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="votre@email.com"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      <span className="flex items-center gap-1.5"><MapPin size={14} /> Localisation</span>
                    </label>
                    <select
                      name="localisation"
                      value={form.localisation}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 transition bg-white"
                    >
                      <option value="">-- Sélectionnez votre localisation --</option>
                      <optgroup label="Conakry — Communes">
                        {['Kaloum', 'Dixinn', 'Matam', 'Ratoma', 'Matoto'].map(p => <option key={p} value={p}>{p}</option>)}
                      </optgroup>
                      <optgroup label="Basse-Guinée">
                        {['Coyah', 'Dubréka', 'Forécariah', 'Boffa', 'Fria', 'Kindia', 'Télimélé', 'Kamsar', 'Boké'].map(p => <option key={p} value={p}>{p}</option>)}
                      </optgroup>
                      <optgroup label="Moyenne-Guinée">
                        {['Labé', 'Mamou', 'Pita', 'Dalaba', 'Mali', 'Koubia', 'Lélouma', 'Tougué'].map(p => <option key={p} value={p}>{p}</option>)}
                      </optgroup>
                      <optgroup label="Haute-Guinée">
                        {['Kankan', 'Siguiri', 'Kouroussa', 'Mandiana', 'Kérouané', 'Faranah', 'Kissidougou', 'Dinguiraye'].map(p => <option key={p} value={p}>{p}</option>)}
                      </optgroup>
                      <optgroup label="Guinée Forestière">
                        {["N'Zérékoré", 'Guéckédou', 'Macenta', 'Yomou', 'Lola', 'Beyla', 'Sipilou'].map(p => <option key={p} value={p}>{p}</option>)}
                      </optgroup>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Message</label>
                    <textarea
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      required
                      rows={4}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 transition resize-none text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white font-bold py-3 px-5 rounded-xl transition flex items-center justify-center gap-2"
                  >
                    {sending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Envoi en cours…
                      </>
                    ) : (
                      <>
                        <Send size={16} /> Envoyer le message
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
