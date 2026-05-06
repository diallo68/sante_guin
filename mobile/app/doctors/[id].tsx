import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, TextInput, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

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

interface Review {
  _id: string;
  patientName: string;
  rating: number;
  comment: string;
  date: string;
}

function getNextDates() {
  const dates = [];
  const today = new Date();
  const DAY = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const iso = d.toISOString().split('T')[0];
    const label = i === 0 ? "Auj." : i === 1 ? 'Dem.' : `${DAY[d.getDay()]} ${d.getDate()}`;
    dates.push({ date: iso, label });
  }
  return dates;
}

const TIMES = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];

function StarRow({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <Ionicons key={n} name={n <= rating ? 'star' : 'star-outline'} size={size} color="#facc15" />
      ))}
    </View>
  );
}

export default function DoctorDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  // Booking
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [reason, setReason] = useState('');
  const [booking, setBooking] = useState(false);
  const [bookingDone, setBookingDone] = useState(false);

  // Reviews
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);

  const dates = getNextDates();

  useEffect(() => {
    api.get(`/doctors/${id}`)
      .then(res => setDoctor(res.data.doctor))
      .catch(() => {})
      .finally(() => setLoading(false));

    api.get('/reviews', { params: { doctorId: id } })
      .then(res => setReviews(res.data.reviews || []))
      .catch(() => {});

    api.get('/favorites')
      .then(res => {
        const ids: string[] = res.data.doctorIds ?? [];
        setIsFavorite(ids.map(String).includes(String(id)));
      })
      .catch(() => {});
  }, [id]);

  const handleBook = async () => {
    if (!user) {
      Alert.alert('Connexion requise', 'Vous devez être connecté pour prendre un rendez-vous.', [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Se connecter', onPress: () => router.push('/(auth)/login') },
      ]);
      return;
    }
    if (!selectedDate || !selectedTime) {
      Alert.alert('Sélection manquante', 'Choisissez une date et une heure.');
      return;
    }
    setBooking(true);
    try {
      await api.post('/appointments', { doctorId: id, date: selectedDate, time: selectedTime, reason });
      setBookingDone(true);
    } catch (e: any) {
      Alert.alert('Erreur', e?.response?.data?.error || 'Erreur lors de la réservation.');
    } finally {
      setBooking(false);
    }
  };

  const handleReview = async () => {
    if (!user) {
      Alert.alert('Connexion requise', 'Connectez-vous pour laisser un avis.', [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Se connecter', onPress: () => router.push('/(auth)/login') },
      ]);
      return;
    }
    if (!reviewRating) {
      Alert.alert('Note manquante', 'Choisissez une note de 1 à 5 étoiles.');
      return;
    }
    setSubmittingReview(true);
    try {
      const res = await api.post('/reviews', { doctorId: id, rating: reviewRating, comment: reviewComment });
      setReviews(prev => [res.data.review, ...prev]);
      setReviewDone(true);
      setReviewRating(0);
      setReviewComment('');
      if (doctor) {
        setDoctor(prev => prev ? {
          ...prev,
          reviewCount: prev.reviewCount + 1,
          rating: Math.round(((prev.rating * prev.reviewCount) + reviewRating) / (prev.reviewCount + 1) * 10) / 10,
        } : prev);
      }
    } catch (e: any) {
      Alert.alert('Erreur', e?.response?.data?.error || 'Erreur lors de la publication.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' }}>
        <ActivityIndicator size="large" color="#0d9488" />
      </SafeAreaView>
    );
  }

  if (!doctor) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb', padding: 32 }}>
        <Ionicons name="alert-circle-outline" size={52} color="#d1d5db" />
        <Text style={{ color: '#6b7280', fontSize: 16, marginTop: 12 }}>Médecin introuvable</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: '#0d9488', fontWeight: '700' }}>Retour</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Back */}
        <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, padding: 16 }}>
          <Ionicons name="chevron-back" size={20} color="#0d9488" />
          <Text style={{ color: '#0d9488', fontWeight: '600' }}>Retour</Text>
        </TouchableOpacity>

        {/* Identity */}
        <View style={{ backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 20, padding: 20, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <View style={{ width: 72, height: 72, backgroundColor: '#dbeafe', borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 36 }}>👨‍⚕️</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 20, fontWeight: '800', color: '#111827', flex: 1 }}>Dr. {doctor.firstName} {doctor.lastName}</Text>
                <TouchableOpacity
                  onPress={async () => {
                    const next = !isFavorite;
                    setIsFavorite(next);
                    api.post('/favorites', { type: 'doctor', targetId: id }).catch(() => setIsFavorite(!next));
                  }}
                  style={{ padding: 4 }}
                >
                  <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={24} color={isFavorite ? '#ef4444' : '#9ca3af'} />
                </TouchableOpacity>
              </View>
              <Text style={{ color: '#2563eb', fontWeight: '700', fontSize: 14, marginTop: 2 }}>{doctor.specialty}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                {doctor.rating > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <Ionicons name="star" size={14} color="#facc15" />
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151' }}>
                      {doctor.rating.toFixed(1)} ({doctor.reviewCount})
                    </Text>
                  </View>
                )}
                <View style={{ backgroundColor: doctor.isAvailable ? '#dcfce7' : '#f3f4f6', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: doctor.isAvailable ? '#15803d' : '#6b7280' }}>
                    {doctor.isAvailable ? 'Disponible' : 'Indisponible'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#f3f4f6' }}>
            <Ionicons name="location-outline" size={15} color="#9ca3af" />
            <Text style={{ color: '#6b7280', fontSize: 13 }}>{doctor.city}{doctor.address ? ` · ${doctor.address}` : ''}</Text>
          </View>

          {doctor.bio && (
            <Text style={{ color: '#4b5563', fontSize: 14, lineHeight: 20, marginTop: 12 }}>{doctor.bio}</Text>
          )}
        </View>

        {/* Contact */}
        {(doctor.phone || doctor.consultationFee) && (
          <View style={{ backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 20, padding: 20, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3, marginBottom: 16, gap: 10 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 }}>Contact</Text>
            {doctor.phone && (
              <TouchableOpacity
                onPress={() => Linking.openURL(`tel:${doctor.phone}`)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f0fdfa', padding: 14, borderRadius: 14 }}
              >
                <Ionicons name="call" size={18} color="#0d9488" />
                <Text style={{ color: '#0d9488', fontWeight: '600', fontSize: 15 }}>{doctor.phone}</Text>
              </TouchableOpacity>
            )}
            {doctor.consultationFee && (
              <View style={{ backgroundColor: '#f0fdfa', padding: 14, borderRadius: 14 }}>
                <Text style={{ color: '#6b7280', fontSize: 12, marginBottom: 2 }}>Tarif consultation</Text>
                <Text style={{ color: '#0d9488', fontWeight: '800', fontSize: 22 }}>{doctor.consultationFee.toLocaleString()} FG</Text>
              </View>
            )}
          </View>
        )}

        {/* Booking */}
        <View style={{ backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 20, padding: 20, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3, marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 16 }}>
            Prendre un rendez-vous
          </Text>

          {bookingDone ? (
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <View style={{ width: 60, height: 60, backgroundColor: '#dcfce7', borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Ionicons name="checkmark-circle" size={32} color="#16a34a" />
              </View>
              <Text style={{ fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 6 }}>Rendez-vous demandé !</Text>
              <Text style={{ color: '#6b7280', fontSize: 13, textAlign: 'center' }}>
                Le {selectedDate} à {selectedTime}.{'\n'}Le médecin confirmera votre rendez-vous.
              </Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/appointments')} style={{ marginTop: 16, backgroundColor: '#0d9488', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 }}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Voir mes rendez-vous</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Date</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {dates.map(d => (
                    <TouchableOpacity
                      key={d.date}
                      onPress={() => setSelectedDate(d.date)}
                      style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: selectedDate === d.date ? '#0d9488' : '#f3f4f6' }}
                    >
                      <Text style={{ fontWeight: '700', fontSize: 13, color: selectedDate === d.date ? '#fff' : '#374151' }}>{d.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Heure</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {TIMES.map(t => (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setSelectedTime(t)}
                    style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: selectedTime === t ? '#0d9488' : '#f3f4f6', minWidth: 72, alignItems: 'center' }}
                  >
                    <Text style={{ fontWeight: '700', fontSize: 13, color: selectedTime === t ? '#fff' : '#374151' }}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 }}>Motif (optionnel)</Text>
              <TextInput
                value={reason}
                onChangeText={setReason}
                placeholder="Ex : Consultation générale, douleur..."
                placeholderTextColor="#9ca3af"
                style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#111827', marginBottom: 16 }}
              />

              <TouchableOpacity
                onPress={handleBook}
                disabled={booking || !doctor.isAvailable}
                style={{ backgroundColor: !doctor.isAvailable ? '#d1d5db' : '#0d9488', borderRadius: 14, paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
              >
                {booking && <ActivityIndicator color="#fff" size="small" />}
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
                  {booking ? 'Réservation...' : 'Confirmer le rendez-vous'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Reviews */}
        <View style={{ backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 20, padding: 20, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3, marginBottom: 32 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 16 }}>
            Avis patients {doctor.reviewCount > 0 ? `(${doctor.reviewCount})` : ''}
          </Text>

          {/* Formulaire */}
          {!reviewDone ? (
            <View style={{ backgroundColor: '#f0fdfa', borderRadius: 14, padding: 16, marginBottom: 20 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 10 }}>Laisser un avis</Text>
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <TouchableOpacity key={n} onPress={() => setReviewRating(n)}>
                    <Ionicons name={n <= reviewRating ? 'star' : 'star-outline'} size={30} color="#facc15" />
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                value={reviewComment}
                onChangeText={setReviewComment}
                placeholder="Partagez votre expérience (optionnel)..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
                style={{ borderWidth: 1, borderColor: '#d1fae5', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111827', marginBottom: 12, minHeight: 80, textAlignVertical: 'top' }}
              />
              <TouchableOpacity
                onPress={handleReview}
                disabled={submittingReview}
                style={{ backgroundColor: '#0d9488', borderRadius: 10, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
              >
                {submittingReview && <ActivityIndicator size="small" color="#fff" />}
                <Text style={{ color: '#fff', fontWeight: '700' }}>Publier l&apos;avis</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ backgroundColor: '#dcfce7', borderRadius: 14, padding: 14, marginBottom: 20, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
              <Text style={{ color: '#15803d', fontWeight: '600' }}>Merci pour votre avis !</Text>
            </View>
          )}

          {/* Liste */}
          {reviews.length === 0 ? (
            <Text style={{ color: '#9ca3af', fontSize: 14, textAlign: 'center', paddingVertical: 16 }}>
              Aucun avis pour le moment. Soyez le premier !
            </Text>
          ) : (
            <View style={{ gap: 14 }}>
              {reviews.map((r, i) => (
                <View key={r._id} style={{ paddingBottom: 14, borderBottomWidth: i < reviews.length - 1 ? 1 : 0, borderBottomColor: '#f3f4f6' }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={{ fontWeight: '700', color: '#111827', fontSize: 14 }}>{r.patientName}</Text>
                    <StarRow rating={r.rating} size={13} />
                  </View>
                  {r.comment ? <Text style={{ color: '#4b5563', fontSize: 13, lineHeight: 18 }}>{r.comment}</Text> : null}
                  <Text style={{ color: '#9ca3af', fontSize: 11, marginTop: 4 }}>
                    {new Date(r.date).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
