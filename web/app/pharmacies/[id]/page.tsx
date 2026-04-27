'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Star, MapPin, Clock, Phone, Mail, Package,
  Truck, Heart, CheckCircle, AlertCircle, Loader2,
} from 'lucide-react';

interface Pharmacy {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  city: string;
  address?: string;
  photo?: string;
  isOpen24h: boolean;
  openTime?: string;
  closeTime?: string;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
}

function isCurrentlyOpen(pharmacy: Pharmacy): boolean {
  if (pharmacy.isOpen24h) return true;
  if (!pharmacy.openTime || !pharmacy.closeTime) return false;
  const now = new Date();
  const [oh, om] = pharmacy.openTime.split(':').map(Number);
  const [ch, cm] = pharmacy.closeTime.split(':').map(Number);
  const current = now.getHours() * 60 + now.getMinutes();
  return current >= oh * 60 + om && current < ch * 60 + cm;
}

export default function PharmacyDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    fetch(`/api/pharmacies/${id}`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then(data => { if (data?.pharmacy) setPharmacy(data.pharmacy); })
      .catch(console.error)
      .finally(() => setLoading(false));

    fetch('/api/favorites')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.pharmacyIds) {
          setIsFavorite(data.pharmacyIds.map(String).includes(String(id)));
        }
      })
      .catch(() => {});
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (notFound || !pharmacy) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-12 h-12 text-gray-400" />
        <h1 className="text-xl font-bold text-gray-700">Pharmacie introuvable</h1>
        <Link href="/pharmacies" className="text-emerald-600 hover:underline">← Retour à la liste</Link>
      </div>
    );
  }

  const isOpen = isCurrentlyOpen(pharmacy);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/pharmacies" className="text-emerald-600 hover:text-emerald-700 font-semibold inline-flex items-center gap-1">
            ← Retour aux pharmacies
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── LEFT COL ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Identity card */}
            <div className="bg-white rounded-2xl shadow-md p-8">
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 bg-emerald-100 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0">
                  💊
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-1">
                    <h1 className="text-2xl font-bold text-gray-900">{pharmacy.name}</h1>
                    <button
                      onClick={async () => {
                        const next = !isFavorite;
                        setIsFavorite(next);
                        await fetch('/api/favorites', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ type: 'pharmacy', targetId: id }),
                        });
                      }}
                      className="p-2 hover:bg-gray-100 rounded-full transition"
                      title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                    >
                      <Heart size={26} className={isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'} />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    {pharmacy.rating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-bold text-gray-900">{pharmacy.rating.toFixed(1)}</span>
                        <span className="text-gray-500 text-sm">({pharmacy.reviewCount} avis)</span>
                      </div>
                    )}
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {isOpen ? '✓ Ouvert' : 'Fermé'}
                    </span>
                    {pharmacy.isVerified && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-teal-100 text-teal-700 text-xs font-bold rounded-full">
                        <CheckCircle size={11} /> Vérifié
                      </span>
                    )}
                    {pharmacy.isOpen24h && (
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                        24h/24
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={14} className="text-gray-400" />
                      {pharmacy.city}{pharmacy.address ? ` · ${pharmacy.address}` : ''}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} className="text-gray-400" />
                      {pharmacy.isOpen24h ? '24h/24 · 7j/7' : `${pharmacy.openTime} – ${pharmacy.closeTime}`}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Services */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Package size={16} className="text-emerald-600" /> Services
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  'Médicaments sur ordonnance',
                  'Produits parapharmaceutiques',
                  'Conseil pharmaceutique',
                  'Tests rapides (Malaria, COVID...)',
                  'Gestion des ordonnances',
                  ...(pharmacy.isOpen24h ? ['Ouverture 24h/24 · 7j/7'] : []),
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl">
                    <CheckCircle size={15} className="text-emerald-600 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{s}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery */}
            <div className="bg-white rounded-2xl shadow-md p-6 border-2 border-emerald-100">
              <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Truck size={16} className="text-emerald-600" /> Livraison à domicile
              </h3>
              <p className="text-sm text-gray-500">
                Contactez directement la pharmacie pour connaître les modalités de livraison et les zones desservies.
              </p>
              {pharmacy.phone && (
                <a
                  href={`tel:${pharmacy.phone}`}
                  className="mt-4 inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-xl transition text-sm"
                >
                  <Phone size={15} /> Appeler pour commander
                </a>
              )}
            </div>

            {/* Horaires */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock size={16} className="text-gray-500" /> Horaires d'ouverture
              </h3>
              {pharmacy.isOpen24h ? (
                <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                  <CheckCircle className="text-emerald-600" size={20} />
                  <div>
                    <p className="font-bold text-emerald-800">Ouvert 24h/24 · 7j/7</p>
                    <p className="text-sm text-emerald-600">Cette pharmacie ne ferme jamais</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map(day => (
                    <div key={day} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <Clock size={14} className="text-gray-400" />
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{day}</p>
                        <p className="text-xs text-gray-500">
                          {day === 'Dimanche' ? 'Fermé' : `${pharmacy.openTime} – ${pharmacy.closeTime}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT COL — CONTACT ── */}
          <div className="sticky top-4 space-y-4">
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Contact</h3>

              <div className="space-y-3 mb-6">
                {pharmacy.phone && (
                  <a href={`tel:${pharmacy.phone}`} className="flex items-center gap-3 p-3 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition">
                    <Phone size={18} className="text-emerald-600" />
                    <span className="text-emerald-700 font-semibold">{pharmacy.phone}</span>
                  </a>
                )}
                {pharmacy.email && (
                  <a href={`mailto:${pharmacy.email}`} className="flex items-center gap-3 p-3 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition">
                    <Mail size={18} className="text-emerald-600" />
                    <span className="text-emerald-700 font-semibold text-sm">{pharmacy.email}</span>
                  </a>
                )}
              </div>

              <div className="space-y-2">
                {pharmacy.phone && (
                  <a
                    href={`tel:${pharmacy.phone}`}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 text-sm"
                  >
                    <Phone size={16} /> Appeler maintenant
                  </a>
                )}
                <a
                  href={`https://wa.me/${pharmacy.phone?.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 text-sm"
                >
                  WhatsApp
                </a>
              </div>
            </div>

            {/* Statut */}
            <div className={`rounded-2xl p-5 border-2 text-center ${
              isOpen ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <div className={`text-3xl mb-2 font-bold ${isOpen ? 'text-green-700' : 'text-red-700'}`}>
                {isOpen ? 'OUVERT' : 'FERMÉ'}
              </div>
              <p className="text-sm text-gray-600">
                {pharmacy.isOpen24h
                  ? 'Disponible 24h/24 · 7j/7'
                  : `Horaires : ${pharmacy.openTime} – ${pharmacy.closeTime}`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
