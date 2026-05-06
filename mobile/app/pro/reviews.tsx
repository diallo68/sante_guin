import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';

const T = '#0d9488';

interface Review {
  _id: string;
  patientName: string;
  rating: number;
  comment?: string;
  date: string;
  verified?: boolean;
}

interface ReviewStats {
  rating: number;
  reviewCount: number;
}

const FILTERS = ['Tous', '5 étoiles', '4 étoiles', '3 étoiles', '2 étoiles', '1 étoile'];

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <Ionicons key={n} name={n <= rating ? 'star' : 'star-outline'} size={size} color="#fbbf24" />
      ))}
    </View>
  );
}

function StatBar({ count, total, star }: { count: number; total: number; star: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
      <Text style={{ fontSize: 11, color: '#64748b', width: 14, textAlign: 'right' }}>{star}</Text>
      <Ionicons name="star" size={11} color="#fbbf24" />
      <View style={{ flex: 1, height: 6, backgroundColor: '#f1f5f9', borderRadius: 3 }}>
        <View style={{ width: `${pct}%`, height: 6, backgroundColor: '#fbbf24', borderRadius: 3 }} />
      </View>
      <Text style={{ fontSize: 11, color: '#94a3b8', width: 20 }}>{count}</Text>
    </View>
  );
}

export default function ProReviewsScreen() {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats>({ rating: 0, reviewCount: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Tous');

  useEffect(() => {
    api.get('/pro/reviews')
      .then(res => {
        setReviews(res.data.reviews || []);
        setStats({ rating: res.data.rating || 0, reviewCount: res.data.reviewCount || 0 });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = reviews.filter(r => {
    if (filter === 'Tous') return true;
    const star = parseInt(filter[0]);
    return r.rating === star;
  });

  const starCounts = [5, 4, 3, 2, 1].map(s => reviews.filter(r => r.rating === s).length);
  const satisfaction = reviews.length > 0 ? Math.round((reviews.filter(r => r.rating >= 4).length / reviews.length) * 100) : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <View style={{ backgroundColor: T, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 }}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '600' }}>Retour</Text>
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900' }}>Mes avis</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={T} size="large" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 14 }}>
          {/* Stats cards */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
              <Text style={{ fontSize: 32, fontWeight: '900', color: '#0f172a' }}>{stats.rating.toFixed(1)}</Text>
              <Stars rating={Math.round(stats.rating)} size={16} />
              <Text style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Note moyenne</Text>
            </View>
            <View style={{ flex: 1, gap: 10 }}>
              <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 12, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 }}>
                <Text style={{ fontSize: 22, fontWeight: '900', color: '#0f172a' }}>{stats.reviewCount}</Text>
                <Text style={{ fontSize: 11, color: '#64748b' }}>Avis total</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 12, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 }}>
                <Text style={{ fontSize: 22, fontWeight: '900', color: T }}>{satisfaction}%</Text>
                <Text style={{ fontSize: 11, color: '#64748b' }}>Satisfaction</Text>
              </View>
            </View>
          </View>

          {/* Rating distribution */}
          {reviews.length > 0 && (
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#334155', marginBottom: 12, letterSpacing: 0.5 }}>Répartition des notes</Text>
              {[5, 4, 3, 2, 1].map((s, i) => (
                <StatBar key={s} star={s} count={starCounts[i]} total={reviews.length} />
              ))}
            </View>
          )}

          {/* Filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {FILTERS.map(f => (
              <TouchableOpacity
                key={f}
                onPress={() => setFilter(f)}
                style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: filter === f ? T : '#fff', borderWidth: 1.5, borderColor: filter === f ? T : '#e2e8f0' }}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: filter === f ? '#fff' : '#64748b' }}>{f}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Review list */}
          {filtered.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Ionicons name="star-outline" size={40} color="#d1d5db" />
              <Text style={{ color: '#94a3b8', marginTop: 10, fontSize: 14 }}>Aucun avis dans cette catégorie</Text>
            </View>
          ) : filtered.map(r => (
            <View key={r._id} style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#f0fdfa', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="person" size={20} color={T} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a' }}>{r.patientName}</Text>
                    {r.verified && <Ionicons name="checkmark-circle" size={13} color={T} />}
                  </View>
                  <Stars rating={r.rating} />
                </View>
                <Text style={{ fontSize: 11, color: '#94a3b8' }}>{r.date}</Text>
              </View>
              {r.comment && <Text style={{ fontSize: 14, color: '#475569', lineHeight: 20 }}>{r.comment}</Text>}
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
