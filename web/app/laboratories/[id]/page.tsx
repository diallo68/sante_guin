'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Star, MapPin, Clock, Phone, Mail, Heart,
  CheckCircle, AlertCircle, Loader2, FlaskConical,
} from 'lucide-react';
import { isCurrentlyOpen } from '@/lib/openingHours';

interface Laboratory {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  city: string;
  address?: string;
  photo?: string;
  analyses: string[];
  isOpen24h: boolean;
  openTime?: string;
  closeTime?: string;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
}

export default function LaboratoryDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [laboratory, setLaboratory] = useState<Laboratory | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    fetch(`/api/laboratories/${id}`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then(data => { if (data?.laboratory) setLaboratory(data.laboratory); })
      .catch(console.error)
      .finally(() => setLoading(false));

    fetch('/api/favorites')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.laboratoryIds) {
          setIsFavorite(data.laboratoryIds.map(String).includes(String(id)));
        }
      })
      .catch(() => {});
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-teal-600" />
      </div>
    );
  }

  if (notFound || !laboratory) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-12 h-12 text-gray-400" />
        <h1 className="text-xl font-bold text-gray-700">Laboratoire introuvable</h1>
        <Link href="/laboratories" className="text-teal-600 hover:underline">← Retour à la liste</Link>
      </div>
    );
  }

  const isOpen = isCurrentlyOpen(laboratory.openTime, laboratory.closeTime, laboratory.isOpen24h);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/laboratories" className="text-teal-600 hover:text-teal-700 font-semibold inline-flex items-center gap-1">
            ← Retour aux laboratoires
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
                <div className="w-20 h-20 bg-teal-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <FlaskConical className="w-10 h-10 text-teal-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-1">
                    <h1 className="text-2xl font-bold text-gray-900">{laboratory.name}</h1>
                    <button
                      onClick={async () => {
                        const previous = isFavorite;
                        setIsFavorite(!previous);
                        try {
                          const res = await fetch('/api/favorites', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ type: 'laboratory', targetId: id }),
                          });
                          // Revenir à l'état précédent si la requête échoue —
                          // sans ça l'icône restait "favori" même en échec —
                          // voir audit B14.
                          if (!res.ok) setIsFavorite(previous);
                        } catch {
                          setIsFavorite(previous);
                        }
                      }}
                      className="p-2 hover:bg-gray-100 rounded-full transition"
                      title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                    >
                      <Heart size={26} className={isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'} />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    {laboratory.rating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-bold text-gray-900">{laboratory.rating.toFixed(1)}</span>
                        <span className="text-gray-500 text-sm">({laboratory.reviewCount} avis)</span>
                      </div>
                    )}
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {isOpen ? '✓ Ouvert' : 'Fermé'}
                    </span>
                    {laboratory.isVerified && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-teal-100 text-teal-700 text-xs font-bold rounded-full">
                        <CheckCircle size={11} /> Vérifié
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={14} className="text-gray-400" />
                      {laboratory.city}{laboratory.address ? ` · ${laboratory.address}` : ''}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} className="text-gray-400" />
                      {laboratory.isOpen24h ? '24h/24 · 7j/7' : `${laboratory.openTime} – ${laboratory.closeTime}`}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Analyses disponibles */}
            {laboratory.analyses.length > 0 && (
              <div className="bg-white rounded-2xl shadow-md p-6">
                <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FlaskConical size={16} className="text-teal-600" /> Analyses disponibles
                </h3>
                <div className="flex flex-wrap gap-2">
                  {laboratory.analyses.map((analysis, i) => (
                    <span key={i} className="px-3 py-1.5 bg-teal-50 text-teal-700 rounded-lg text-sm font-medium border border-teal-100">
                      {analysis}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Services */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle size={16} className="text-teal-600" /> Services
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  'Analyses biologiques',
                  'Bilan sanguin complet',
                  'Tests rapides (Malaria, COVID...)',
                  'Résultats en ligne',
                  'Prélèvement à domicile sur demande',
                  'Résultats confidentiels',
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-2 p-3 bg-teal-50 rounded-xl">
                    <CheckCircle size={15} className="text-teal-600 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{s}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Horaires */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock size={16} className="text-gray-500" /> Horaires d'ouverture
              </h3>
              {laboratory.isOpen24h ? (
                <div className="flex items-center gap-3 p-4 bg-teal-50 rounded-xl border border-teal-200">
                  <CheckCircle className="text-teal-600" size={20} />
                  <div>
                    <p className="font-bold text-teal-800">Ouvert 24h/24 · 7j/7</p>
                    <p className="text-sm text-teal-600">Ce laboratoire ne ferme jamais</p>
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
                          {day === 'Dimanche' ? 'Fermé' : `${laboratory.openTime} – ${laboratory.closeTime}`}
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
                {laboratory.phone && (
                  <a href={`tel:${laboratory.phone}`} className="flex items-center gap-3 p-3 bg-teal-50 hover:bg-teal-100 rounded-xl transition">
                    <Phone size={18} className="text-teal-600" />
                    <span className="text-teal-700 font-semibold">{laboratory.phone}</span>
                  </a>
                )}
                {laboratory.email && (
                  <a href={`mailto:${laboratory.email}`} className="flex items-center gap-3 p-3 bg-teal-50 hover:bg-teal-100 rounded-xl transition">
                    <Mail size={18} className="text-teal-600" />
                    <span className="text-teal-700 font-semibold text-sm">{laboratory.email}</span>
                  </a>
                )}
              </div>

              <div className="space-y-2">
                {laboratory.phone && (
                  <a
                    href={`tel:${laboratory.phone}`}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 text-sm"
                  >
                    <Phone size={16} /> Appeler maintenant
                  </a>
                )}
                {laboratory.phone && (
                  <a
                    href={`https://wa.me/${laboratory.phone?.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 text-sm"
                  >
                    WhatsApp
                  </a>
                )}
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
                {laboratory.isOpen24h
                  ? 'Disponible 24h/24 · 7j/7'
                  : `Horaires : ${laboratory.openTime} – ${laboratory.closeTime}`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
