'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Star, MapPin, Globe, Phone, Mail, Calendar,
  Heart, CheckCircle, AlertCircle, Loader2, MessageSquare,
} from 'lucide-react';

interface Review {
  _id: string;
  patientName: string;
  rating: number;
  comment: string;
  date: string;
}

interface Doctor {
  _id: string;
  firstName: string;
  lastName: string;
  specialty: string;
  phone?: string;
  email?: string;
  city: string;
  address?: string;
  bio?: string;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  isAvailable: boolean;
  consultationFee?: number;
  languages: string[];
}

// Generate next 7 available dates from today
function getNextDates() {
  const dates = [];
  const today = new Date();
  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const iso = d.toISOString().split('T')[0];
    const label = i === 0 ? "Aujourd'hui" : i === 1 ? 'Demain' : dayNames[d.getDay()];
    dates.push({ date: iso, label: `${label} ${d.getDate()}/${d.getMonth() + 1}` });
  }
  return dates;
}

const TIMES = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];

export default function DoctorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewHover, setReviewHover] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Booking state
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [reason, setReason] = useState('');
  const [booking, setBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState('');

  const availableDates = getNextDates();

  useEffect(() => {
    fetch(`/api/doctors/${id}`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then(data => { if (data?.doctor) setDoctor(data.doctor); })
      .catch(console.error)
      .finally(() => setLoading(false));

    fetch(`/api/reviews?doctorId=${id}`)
      .then(r => r.json())
      .then(data => { if (data.reviews) setReviews(data.reviews); })
      .catch(() => {});

    fetch('/api/favorites')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.doctorIds) {
          setIsFavorite(data.doctorIds.map(String).includes(String(id)));
        }
      })
      .catch(() => {});
  }, [id]);

  const handleReviewSubmit = async () => {
    if (!reviewRating) { setReviewError('Choisissez une note.'); return; }
    setSubmittingReview(true);
    setReviewError('');
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorId: id, rating: reviewRating, comment: reviewComment }),
      });
      const data = await res.json();
      if (res.status === 401) { router.push('/auth/login'); return; }
      if (!res.ok) { setReviewError(data.error || 'Erreur'); return; }
      setReviews(prev => [data.review, ...prev]);
      setReviewSuccess(true);
      setReviewRating(0);
      setReviewComment('');
      setDoctor(prev => prev ? {
        ...prev,
        reviewCount: prev.reviewCount + 1,
        rating: Math.round(((prev.rating * prev.reviewCount) + reviewRating) / (prev.reviewCount + 1) * 10) / 10,
      } : prev);
    } catch {
      setReviewError('Erreur de connexion.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime) {
      setBookingError('Veuillez choisir une date et une heure.');
      return;
    }
    setBooking(true);
    setBookingError('');
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorId: id, date: selectedDate, time: selectedTime, reason }),
      });
      const data = await res.json();
      if (res.status === 401) { router.push('/auth/login'); return; }
      if (!res.ok) { setBookingError(data.error || 'Erreur lors de la réservation.'); return; }
      setBookingSuccess(true);
    } catch {
      setBookingError('Erreur de connexion au serveur.');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (notFound || !doctor) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-12 h-12 text-gray-400" />
        <h1 className="text-xl font-bold text-gray-700">Médecin introuvable</h1>
        <Link href="/doctors" className="text-blue-600 hover:underline">← Retour à la liste</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/doctors" className="text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1">
            ← Retour aux médecins
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── LEFT COL ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Identity card */}
            <div className="bg-white rounded-2xl shadow-md p-8">
              <div className="flex items-start gap-6 mb-6">
                <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0">
                  👨‍⚕️
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">
                        Dr. {doctor.firstName} {doctor.lastName}
                      </h1>
                      <p className="text-lg text-blue-600 font-semibold">{doctor.specialty}</p>
                    </div>
                    <button
                      onClick={async () => {
                        const next = !isFavorite;
                        setIsFavorite(next);
                        await fetch('/api/favorites', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ type: 'doctor', targetId: id }),
                        });
                      }}
                      className="p-2 hover:bg-gray-100 rounded-full transition"
                      title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                    >
                      <Heart size={26} className={isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'} />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    {doctor.rating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-bold text-gray-900">{doctor.rating.toFixed(1)}</span>
                        <span className="text-gray-500 text-sm">({doctor.reviewCount} avis)</span>
                      </div>
                    )}
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      doctor.isAvailable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {doctor.isAvailable ? '✓ Disponible' : 'Non disponible'}
                    </span>
                    {doctor.isVerified && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-teal-100 text-teal-700 text-xs font-bold rounded-full">
                        <CheckCircle size={11} /> Vérifié
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
                    <div className="flex items-center gap-1.5"><MapPin size={14} className="text-gray-400" />{doctor.city}{doctor.address ? ` · ${doctor.address}` : ''}</div>
                    {doctor.languages.length > 0 && (
                      <div className="flex items-center gap-1.5"><Globe size={14} className="text-gray-400" />{doctor.languages.join(', ')}</div>
                    )}
                  </div>
                </div>
              </div>

              {doctor.bio && (
                <div className="border-t border-gray-100 pt-5">
                  <h2 className="text-base font-bold text-gray-900 mb-2">À propos</h2>
                  <p className="text-gray-600 leading-relaxed">{doctor.bio}</p>
                </div>
              )}
            </div>

            {/* Consultation fee */}
            {doctor.consultationFee && (
              <div className="bg-white rounded-2xl shadow-md p-6">
                <h3 className="text-base font-bold text-gray-900 mb-3">Tarif de consultation</h3>
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-bold text-blue-700">
                    {doctor.consultationFee.toLocaleString('fr-GN')} FG
                  </div>
                  <span className="text-sm text-gray-500">par consultation</span>
                </div>
              </div>
            )}

            {/* Contact */}
            {(doctor.phone || doctor.email) && (
              <div className="bg-white rounded-2xl shadow-md p-6">
                <h3 className="text-base font-bold text-gray-900 mb-4">Contact</h3>
                <div className="space-y-3">
                  {doctor.phone && (
                    <a href={`tel:${doctor.phone}`} className="flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-xl transition">
                      <Phone size={18} className="text-blue-600" />
                      <span className="text-blue-700 font-semibold">{doctor.phone}</span>
                    </a>
                  )}
                  {doctor.email && (
                    <a href={`mailto:${doctor.email}`} className="flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-xl transition">
                      <Mail size={18} className="text-blue-600" />
                      <span className="text-blue-700 font-semibold">{doctor.email}</span>
                    </a>
                  )}
                </div>
              </div>
            )}
            {/* ── REVIEWS ── */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h3 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
                <MessageSquare size={16} className="text-blue-600" />
                Avis patients
                {doctor.reviewCount > 0 && (
                  <span className="text-sm font-normal text-gray-500 ml-1">({doctor.reviewCount})</span>
                )}
              </h3>

              {/* Formulaire */}
              {!reviewSuccess ? (
                <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Laisser un avis</p>
                  <div className="flex items-center gap-1 mb-3">
                    {[1,2,3,4,5].map(n => (
                      <button
                        key={n}
                        type="button"
                        onMouseEnter={() => setReviewHover(n)}
                        onMouseLeave={() => setReviewHover(0)}
                        onClick={() => setReviewRating(n)}
                        className="transition"
                      >
                        <Star
                          size={28}
                          className={n <= (reviewHover || reviewRating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'}
                        />
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={reviewComment}
                    onChange={e => setReviewComment(e.target.value)}
                    placeholder="Partagez votre expérience (optionnel)..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 resize-none mb-3"
                  />
                  {reviewError && (
                    <p className="text-red-600 text-sm mb-2">{reviewError}</p>
                  )}
                  <button
                    onClick={handleReviewSubmit}
                    disabled={submittingReview}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-5 py-2 rounded-lg transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {submittingReview ? <Loader2 size={14} className="animate-spin" /> : null}
                    Publier l&apos;avis
                  </button>
                </div>
              ) : (
                <div className="mb-6 p-4 bg-green-50 rounded-xl border border-green-200 flex items-center gap-3">
                  <CheckCircle className="text-green-600" size={20} />
                  <p className="text-green-700 font-semibold text-sm">Merci pour votre avis !</p>
                </div>
              )}

              {/* Liste des avis */}
              {reviews.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">Aucun avis pour le moment. Soyez le premier !</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map(r => (
                    <div key={r._id} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                      <div className="flex items-start justify-between mb-1">
                        <p className="font-semibold text-gray-800 text-sm">{r.patientName}</p>
                        <div className="flex items-center gap-0.5">
                          {[1,2,3,4,5].map(n => (
                            <Star key={n} size={13} className={n <= r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} />
                          ))}
                        </div>
                      </div>
                      {r.comment && <p className="text-gray-600 text-sm">{r.comment}</p>}
                      <p className="text-gray-400 text-xs mt-1">{new Date(r.date).toLocaleDateString('fr-FR')}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* ── RIGHT COL — BOOKING ── */}
          <div className="sticky top-4 space-y-4">
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                <Calendar size={20} className="text-blue-600" /> Prendre un rendez-vous
              </h3>

              {bookingSuccess ? (
                <div className="text-center py-6">
                  <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-7 h-7 text-green-600" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-1">Rendez-vous demandé !</h4>
                  <p className="text-sm text-gray-500 mb-5">
                    Le {selectedDate} à {selectedTime}. Le médecin confirmera votre rendez-vous.
                  </p>
                  <button
                    onClick={() => { setBookingSuccess(false); setSelectedDate(''); setSelectedTime(''); setReason(''); }}
                    className="text-blue-600 hover:underline text-sm font-semibold"
                  >
                    Prendre un autre rendez-vous
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                    <select
                      value={selectedDate}
                      onChange={e => setSelectedDate(e.target.value)}
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 bg-white text-sm"
                    >
                      <option value="">Choisir une date</option>
                      {availableDates.map(d => (
                        <option key={d.date} value={d.date}>{d.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Heure</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {TIMES.map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setSelectedTime(t)}
                          className={`py-2 rounded-lg text-sm font-semibold transition ${
                            selectedTime === t
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Motif <span className="text-gray-400 font-normal">(optionnel)</span>
                    </label>
                    <input
                      type="text"
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      placeholder="Ex : Douleur thoracique, bilan..."
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm"
                    />
                  </div>

                  {bookingError && (
                    <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{bookingError}</p>
                  )}

                  <button
                    onClick={handleBooking}
                    disabled={booking || !doctor.isAvailable}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
                  >
                    {booking
                      ? <><Loader2 size={16} className="animate-spin" /> Réservation...</>
                      : <><Calendar size={16} /> Confirmer le rendez-vous</>
                    }
                  </button>

                  {!doctor.isAvailable && (
                    <p className="text-center text-sm text-gray-400">Ce médecin n'accepte pas de nouveaux rendez-vous pour le moment.</p>
                  )}
                </div>
              )}
            </div>

            {doctor.consultationFee && (
              <div className="bg-blue-50 rounded-2xl p-4 text-center border border-blue-100">
                <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider mb-1">Consultation</p>
                <p className="text-2xl font-bold text-blue-800">{doctor.consultationFee.toLocaleString('fr-GN')} FG</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
