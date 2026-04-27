import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  SafeAreaView, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

interface Stats {
  doctors: number | null;
  pharmacies: number | null;
  patients: number | null;
  avgRating: number | null;
}

function formatCount(n: number | null, suffix = '+') {
  if (n === null) return '—';
  if (n >= 1000) return `${Math.floor(n / 1000)} 000${suffix}`;
  return `${n}${suffix}`;
}

const QUICK = [
  { label: 'Généraliste', icon: 'person' },
  { label: 'Cardiologue', icon: 'heart' },
  { label: 'Pédiatre', icon: 'happy' },
  { label: 'Pharmacie 24h', icon: 'storefront' },
];

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState<Stats>({ doctors: null, pharmacies: null, patients: null, avgRating: null });

  useEffect(() => {
    api.get('/stats')
      .then(r => setStats(r.data))
      .catch(() => {});
  }, []);

  const handleSearch = () => {
    if (search.trim()) router.push(`/(tabs)/doctors?search=${encodeURIComponent(search.trim())}`);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0d9488' }}>
      <StatusBar barStyle="light-content" />
      <ScrollView style={{ flex: 1, backgroundColor: '#f9fafb' }} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={{ backgroundColor: '#0d9488', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <View>
              <Text style={{ color: '#99f6e4', fontSize: 13, fontWeight: '600' }}>
                {user ? `Bonjour, ${user.firstName} 👋` : 'Bienvenue 👋'}
              </Text>
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 2 }}>Guinée Santé</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}
              style={{ width: 42, height: 42, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 21, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="person" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <Text style={{ color: '#fff', fontSize: 26, fontWeight: '900', lineHeight: 32, marginBottom: 6 }}>
            Votre santé,{'\n'}
            <Text style={{ color: '#99f6e4' }}>entre de bonnes mains</Text>
          </Text>
          <Text style={{ color: '#ccfbf1', fontSize: 14, marginBottom: 20 }}>
            Trouvez le bon médecin et prenez rendez-vous facilement
          </Text>

          {/* Search */}
          <View style={{ flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 }}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 }}>
              <Ionicons name="search" size={18} color="#9ca3af" />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Médecin, spécialité, pharmacie..."
                placeholderTextColor="#9ca3af"
                returnKeyType="search"
                onSubmitEditing={handleSearch}
                style={{ flex: 1, paddingVertical: 14, paddingLeft: 8, fontSize: 14, color: '#111827' }}
              />
            </View>
            <TouchableOpacity onPress={handleSearch}
              style={{ backgroundColor: '#0d9488', paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View style={{ marginTop: -16, marginHorizontal: 16, flexDirection: 'row', gap: 8, marginBottom: 24 }}>
          {[
            { value: formatCount(stats.doctors), label: 'Médecins' },
            { value: formatCount(stats.pharmacies), label: 'Pharmacies' },
            { value: formatCount(stats.patients), label: 'Patients' },
            { value: stats.avgRating !== null ? `${stats.avgRating}/5` : '—', label: 'Note moy.' },
          ].map((s, i) => (
            <View key={i} style={{ flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 12, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#0d9488' }}>{s.value}</Text>
              <Text style={{ fontSize: 10, color: '#6b7280', marginTop: 2, textAlign: 'center' }}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Quick access */}
        <View style={{ paddingHorizontal: 16, marginBottom: 24, gap: 12 }}>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/doctors')}
            style={{ backgroundColor: '#1d4ed8', borderRadius: 18, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16 }}
          >
            <View style={{ width: 52, height: 52, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="medkit" size={26} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>Trouver un Médecin</Text>
              <Text style={{ color: '#bfdbfe', fontSize: 13, marginTop: 2 }}>{formatCount(stats.doctors)} médecins certifiés</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(tabs)/pharmacies')}
            style={{ backgroundColor: '#059669', borderRadius: 18, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16 }}
          >
            <View style={{ width: 52, height: 52, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="storefront" size={26} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>Trouver une Pharmacie</Text>
              <Text style={{ color: '#a7f3d0', fontSize: 13, marginTop: 2 }}>Ouvertes, horaires, livraison</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>

        {/* Quick links */}
        <View style={{ paddingHorizontal: 16, marginBottom: 32 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 }}>Recherches populaires</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {QUICK.map(q => (
              <TouchableOpacity
                key={q.label}
                onPress={() => router.push(`/(tabs)/doctors?search=${encodeURIComponent(q.label)}`)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: '#e5e7eb', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}
              >
                <Ionicons name={q.icon as any} size={14} color="#0d9488" />
                <Text style={{ fontSize: 13, color: '#374151', fontWeight: '600' }}>{q.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
