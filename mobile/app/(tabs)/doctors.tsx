import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';

interface Doctor {
  _id: string;
  firstName: string;
  lastName: string;
  specialty: string;
  city: string;
  rating: number;
  reviewCount: number;
  isAvailable: boolean;
  consultationFee?: number;
}

// 'Généraliste' ne correspondait jamais à la valeur réellement stockée
// ('Médecin généraliste', choisie à l'inscription) — voir audit B22.
const SPECIALTIES = ['Tous', 'Médecin généraliste', 'Cardiologue', 'Pédiatre', 'Dermatologue', 'Orthopédiste', 'Ophtalmologue', 'ORL', 'Neurologue'];

export default function DoctorsScreen() {
  const router = useRouter();
  const { search: initSearch } = useLocalSearchParams<{ search?: string }>();
  const [search, setSearch] = useState(initSearch || '');
  const [specialty, setSpecialty] = useState('Tous');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Seule la première page était jamais chargée : au-delà de 12 résultats,
  // les médecins suivants restaient invisibles — voir audit B22.
  const fetchDoctors = async (q = search, sp = specialty, pageNum = 1, append = false) => {
    try {
      const params: Record<string, string | number> = { page: pageNum };
      if (q.trim()) params.search = q.trim();
      if (sp !== 'Tous') params.specialty = sp;
      const res = await api.get('/doctors', { params });
      const newDoctors: Doctor[] = res.data.doctors || [];
      setDoctors(prev => append ? [...prev, ...newDoctors] : newDoctors);
      setPage(pageNum);
      setHasMore(pageNum < (res.data.pages || 1));
    } catch {
      if (!append) setDoctors([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  // Debounce search 400ms
  useEffect(() => {
    const t = setTimeout(() => fetchDoctors(search, specialty, 1, false), 400);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => { fetchDoctors(search, specialty, 1, false); }, [specialty]);

  const onRefresh = () => { setRefreshing(true); fetchDoctors(search, specialty, 1, false); };

  const loadMore = () => {
    if (loadingMore || !hasMore || loading) return;
    setLoadingMore(true);
    fetchDoctors(search, specialty, page + 1, true);
  };

  const renderDoctor = ({ item }: { item: Doctor }) => (
    <TouchableOpacity
      onPress={() => router.push(`/doctors/${item._id}`)}
      style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}
    >
      <View style={{ flexDirection: 'row', gap: 14 }}>
        <View style={{ width: 56, height: 56, backgroundColor: '#dbeafe', borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 28 }}>👨‍⚕️</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>
              Dr. {item.firstName} {item.lastName}
            </Text>
            <View style={{ backgroundColor: item.isAvailable ? '#dcfce7' : '#f3f4f6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: item.isAvailable ? '#15803d' : '#6b7280' }}>
                {item.isAvailable ? 'Disponible' : 'Indisponible'}
              </Text>
            </View>
          </View>
          <Text style={{ color: '#2563eb', fontWeight: '600', fontSize: 13, marginTop: 2 }}>{item.specialty}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <Ionicons name="location-outline" size={13} color="#9ca3af" />
              <Text style={{ fontSize: 12, color: '#6b7280' }}>{item.city}</Text>
            </View>
            {item.rating > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Ionicons name="star" size={13} color="#facc15" />
                <Text style={{ fontSize: 12, color: '#374151', fontWeight: '600' }}>{item.rating.toFixed(1)}</Text>
                <Text style={{ fontSize: 12, color: '#9ca3af' }}>({item.reviewCount})</Text>
              </View>
            )}
            {item.consultationFee && (
              <Text style={{ fontSize: 12, color: '#0d9488', fontWeight: '700' }}>
                {item.consultationFee.toLocaleString()} FG
              </Text>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <View style={{ backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
        <Text style={{ fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 12 }}>Médecins</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: '#e5e7eb' }}>
          <Ionicons name="search" size={18} color="#9ca3af" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Nom, spécialité..."
            placeholderTextColor="#9ca3af"
            returnKeyType="search"
            onSubmitEditing={() => fetchDoctors()}
            style={{ flex: 1, paddingVertical: 10, paddingLeft: 8, fontSize: 14, color: '#111827' }}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => { setSearch(''); fetchDoctors(''); }}>
              <Ionicons name="close-circle" size={18} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Specialty filter */}
      <View style={{ paddingVertical: 10 }}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={SPECIALTIES}
          keyExtractor={i => i}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSpecialty(item)}
              style={{
                paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
                backgroundColor: specialty === item ? '#0d9488' : '#fff',
                borderWidth: 1, borderColor: specialty === item ? '#0d9488' : '#e5e7eb',
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: specialty === item ? '#fff' : '#374151' }}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#0d9488" />
        </View>
      ) : (
        <FlatList
          data={doctors}
          keyExtractor={d => d._id}
          renderItem={renderDoctor}
          contentContainerStyle={{ padding: 16, paddingTop: 4 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0d9488" />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ paddingVertical: 20 }}>
                <ActivityIndicator color="#0d9488" />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Ionicons name="medkit-outline" size={48} color="#d1d5db" />
              <Text style={{ color: '#6b7280', fontSize: 16, fontWeight: '600', marginTop: 12 }}>Aucun médecin trouvé</Text>
              <Text style={{ color: '#9ca3af', fontSize: 13, marginTop: 4 }}>Modifiez votre recherche</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
