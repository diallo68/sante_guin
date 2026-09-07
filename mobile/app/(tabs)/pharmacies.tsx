import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';

interface Pharmacy {
  _id: string;
  name: string;
  city: string;
  address?: string;
  isOpen24h: boolean;
  openTime?: string;
  closeTime?: string;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
}

export default function PharmaciesScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [only24h, setOnly24h] = useState(false);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Seule la première page était jamais chargée — voir audit B22.
  const fetchPharmacies = async (q = search, h = only24h, pageNum = 1, append = false) => {
    try {
      const params: Record<string, string | number> = { page: pageNum };
      if (q.trim()) params.search = q.trim();
      if (h) params.open24h = 'true';
      const res = await api.get('/pharmacies', { params });
      const newItems: Pharmacy[] = res.data.pharmacies || [];
      setPharmacies(prev => append ? [...prev, ...newItems] : newItems);
      setPage(pageNum);
      setHasMore(pageNum < (res.data.pages || 1));
    } catch {
      if (!append) setPharmacies([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  // Debounce search 400ms
  useEffect(() => {
    const t = setTimeout(() => fetchPharmacies(search, only24h, 1, false), 400);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => { fetchPharmacies(search, only24h, 1, false); }, [only24h]);

  const onRefresh = () => { setRefreshing(true); fetchPharmacies(search, only24h, 1, false); };

  const loadMore = () => {
    if (loadingMore || !hasMore || loading) return;
    setLoadingMore(true);
    fetchPharmacies(search, only24h, page + 1, true);
  };

  const renderPharmacy = ({ item }: { item: Pharmacy }) => (
    <TouchableOpacity
      onPress={() => router.push(`/pharmacies/${item._id}`)}
      style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}
    >
      <View style={{ flexDirection: 'row', gap: 14 }}>
        <View style={{ width: 56, height: 56, backgroundColor: '#d1fae5', borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 28 }}>💊</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', flex: 1 }}>{item.name}</Text>
            {item.isOpen24h && (
              <View style={{ backgroundColor: '#d1fae5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, marginLeft: 6 }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#065f46' }}>24h/24</Text>
              </View>
            )}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <Ionicons name="location-outline" size={13} color="#9ca3af" />
              <Text style={{ fontSize: 12, color: '#6b7280' }}>{item.city}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <Ionicons name="time-outline" size={13} color="#9ca3af" />
              <Text style={{ fontSize: 12, color: '#6b7280' }}>
                {item.isOpen24h ? '24h/24' : `${item.openTime} – ${item.closeTime}`}
              </Text>
            </View>
          </View>
          {item.rating > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 }}>
              <Ionicons name="star" size={13} color="#facc15" />
              <Text style={{ fontSize: 12, color: '#374151', fontWeight: '600' }}>{item.rating.toFixed(1)}</Text>
              <Text style={{ fontSize: 12, color: '#9ca3af' }}>({item.reviewCount} avis)</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <View style={{ backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
        <Text style={{ fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 12 }}>Pharmacies</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 10 }}>
          <Ionicons name="search" size={18} color="#9ca3af" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Nom, ville..."
            placeholderTextColor="#9ca3af"
            returnKeyType="search"
            onSubmitEditing={() => fetchPharmacies()}
            style={{ flex: 1, paddingVertical: 10, paddingLeft: 8, fontSize: 14, color: '#111827' }}
          />
        </View>
        <TouchableOpacity
          onPress={() => setOnly24h(!only24h)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', backgroundColor: only24h ? '#d1fae5' : '#f3f4f6', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 }}
        >
          <Ionicons name="time" size={16} color={only24h ? '#065f46' : '#6b7280'} />
          <Text style={{ fontSize: 13, fontWeight: '600', color: only24h ? '#065f46' : '#6b7280' }}>Ouvertes 24h/24</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#059669" />
        </View>
      ) : (
        <FlatList
          data={pharmacies}
          keyExtractor={p => p._id}
          renderItem={renderPharmacy}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loadingMore ? <View style={{ paddingVertical: 20 }}><ActivityIndicator color="#059669" /></View> : null}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>💊</Text>
              <Text style={{ color: '#6b7280', fontSize: 16, fontWeight: '600' }}>Aucune pharmacie trouvée</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
