import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';

const TEAL = '#0d9488';
const SPECIALTIES = ['Tous', 'Généraliste', 'Cardiologue', 'Pédiatre', 'Gynécologue', 'Chirurgien', 'Dermatologue', 'ORL'];
type Tab = 'doctors' | 'pharmacies' | 'laboratories';

export default function SearchScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('doctors');
  const [search, setSearch] = useState('');
  const [specialty, setSpecialty] = useState('Tous');
  const [only24h, setOnly24h] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (t = tab, q = search, sp = specialty, h = only24h) => {
    try {
      const params: Record<string, string> = {};
      if (q.trim()) params.search = q.trim();
      if (t === 'doctors' && sp !== 'Tous') params.specialty = sp;
      if (t !== 'doctors' && h) params.open24h = 'true';
      const endpoint = t === 'doctors' ? '/doctors' : t === 'pharmacies' ? '/pharmacies' : '/laboratories';
      const res = await api.get(endpoint, { params });
      setData(res.data.doctors || res.data.pharmacies || res.data.laboratories || []);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setData([]);
    setSearch('');
    setSpecialty('Tous');
    setOnly24h(false);
    fetchData(tab, '', 'Tous', false);
  }, [tab]);

  useEffect(() => {
    const t = setTimeout(() => fetchData(tab, search, specialty, only24h), 400);
    return () => clearTimeout(t);
  }, [search]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const renderDoctor = ({ item }: { item: any }) => (
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
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>
              Dr. {item.firstName} {item.lastName}
            </Text>
            <View style={{ backgroundColor: item.isAvailable ? '#dcfce7' : '#f3f4f6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: item.isAvailable ? '#15803d' : '#6b7280' }}>
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
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderPlace = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => router.push(tab === 'pharmacies' ? `/pharmacies/${item._id}` : `/laboratories/${item._id}`)}
      style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}
    >
      <View style={{ flexDirection: 'row', gap: 14 }}>
        <View style={{ width: 56, height: 56, backgroundColor: tab === 'pharmacies' ? '#dcfce7' : '#fef9c3', borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 28 }}>{tab === 'pharmacies' ? '💊' : '🔬'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827', flex: 1 }}>{item.name}</Text>
            {item.isVerified && (
              <Ionicons name="checkmark-circle" size={16} color={TEAL} />
            )}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 }}>
            <Ionicons name="location-outline" size={13} color="#9ca3af" />
            <Text style={{ fontSize: 12, color: '#6b7280' }}>{item.city}{item.address ? ` · ${item.address}` : ''}</Text>
          </View>
          {item.isOpen24h && (
            <View style={{ backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, alignSelf: 'flex-start', marginTop: 6 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#15803d' }}>24h/24</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const emptyIcon = tab === 'doctors' ? 'medkit-outline' : tab === 'pharmacies' ? 'storefront-outline' : 'flask-outline';
  const emptyLabel = tab === 'doctors' ? 'Aucun médecin trouvé' : tab === 'pharmacies' ? 'Aucune pharmacie trouvée' : 'Aucun laboratoire trouvé';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <View style={{ backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
        <Text style={{ fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 12 }}>Recherche</Text>

        {/* Segment control */}
        <View style={{ flexDirection: 'row', backgroundColor: '#f3f4f6', borderRadius: 12, padding: 3, marginBottom: 12 }}>
          {([['doctors', '👨‍⚕️', 'Médecins'], ['pharmacies', '💊', 'Pharmacies'], ['laboratories', '🔬', 'Labos']] as [Tab, string, string][]).map(([key, icon, label]) => (
            <TouchableOpacity
              key={key}
              onPress={() => setTab(key)}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8, borderRadius: 10, backgroundColor: tab === key ? '#fff' : 'transparent' }}
            >
              <Text style={{ fontSize: 14 }}>{icon}</Text>
              <Text style={{ fontSize: 12, fontWeight: '700', color: tab === key ? TEAL : '#6b7280' }}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Search bar */}
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: '#e5e7eb' }}>
          <Ionicons name="search" size={18} color="#9ca3af" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={tab === 'doctors' ? 'Nom, spécialité...' : 'Nom, ville...'}
            placeholderTextColor="#9ca3af"
            style={{ flex: 1, paddingVertical: 10, paddingLeft: 8, fontSize: 14, color: '#111827' }}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filters */}
      {tab === 'doctors' && (
        <View style={{ paddingVertical: 10 }}>
          <FlatList
            horizontal showsHorizontalScrollIndicator={false}
            data={SPECIALTIES} keyExtractor={i => i}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => { setSpecialty(item); fetchData(tab, search, item, only24h); }}
                style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: specialty === item ? TEAL : '#fff', borderWidth: 1, borderColor: specialty === item ? TEAL : '#e5e7eb' }}
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: specialty === item ? '#fff' : '#374151' }}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {tab !== 'doctors' && (
        <View style={{ paddingHorizontal: 16, paddingVertical: 10 }}>
          <TouchableOpacity
            onPress={() => { setOnly24h(!only24h); fetchData(tab, search, specialty, !only24h); }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', backgroundColor: only24h ? '#dcfce7' : '#fff', borderWidth: 1, borderColor: only24h ? '#16a34a' : '#e5e7eb', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 }}
          >
            <Ionicons name="time-outline" size={15} color={only24h ? '#15803d' : '#6b7280'} />
            <Text style={{ fontSize: 12, fontWeight: '600', color: only24h ? '#15803d' : '#374151' }}>Ouvert 24h/24</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={TEAL} />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={d => d._id}
          renderItem={tab === 'doctors' ? renderDoctor : renderPlace}
          contentContainerStyle={{ padding: 16, paddingTop: 4 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={TEAL} />}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Ionicons name={emptyIcon as any} size={48} color="#d1d5db" />
              <Text style={{ color: '#6b7280', fontSize: 16, fontWeight: '600', marginTop: 12 }}>{emptyLabel}</Text>
              <Text style={{ color: '#9ca3af', fontSize: 13, marginTop: 4 }}>Modifiez votre recherche</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
