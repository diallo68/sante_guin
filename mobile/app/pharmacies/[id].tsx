import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';
import { isCurrentlyOpen } from '@/lib/openingHours';

interface Pharmacy {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  city: string;
  address?: string;
  isOpen24h: boolean;
  openTime?: string;
  closeTime?: string;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
}

export default function PharmacyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/pharmacies/${id}`)
      .then(res => setPharmacy(res.data.pharmacy))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' }}>
        <ActivityIndicator size="large" color="#059669" />
      </SafeAreaView>
    );
  }

  if (!pharmacy) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb', padding: 32 }}>
        <Text style={{ color: '#6b7280', fontSize: 16 }}>Pharmacie introuvable</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: '#059669', fontWeight: '700' }}>Retour</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const open = isCurrentlyOpen(pharmacy.openTime, pharmacy.closeTime, pharmacy.isOpen24h);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, padding: 16 }}>
          <Ionicons name="chevron-back" size={20} color="#059669" />
          <Text style={{ color: '#059669', fontWeight: '600' }}>Retour</Text>
        </TouchableOpacity>

        {/* Identity */}
        <View style={{ backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 20, padding: 20, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <View style={{ width: 68, height: 68, backgroundColor: '#d1fae5', borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 34 }}>💊</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 19, fontWeight: '800', color: '#111827' }}>{pharmacy.name}</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                <View style={{ backgroundColor: open ? '#dcfce7' : '#fee2e2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: open ? '#15803d' : '#dc2626' }}>
                    {open ? '✓ Ouvert' : 'Fermé'}
                  </Text>
                </View>
                {pharmacy.isOpen24h && (
                  <View style={{ backgroundColor: '#d1fae5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#065f46' }}>24h/24</Text>
                  </View>
                )}
                {pharmacy.isVerified && (
                  <View style={{ backgroundColor: '#f0fdfa', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#0d9488' }}>✓ Vérifié</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <View style={{ marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#f3f4f6', gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="location-outline" size={15} color="#9ca3af" />
              <Text style={{ color: '#6b7280', fontSize: 13 }}>{pharmacy.city}{pharmacy.address ? ` · ${pharmacy.address}` : ''}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="time-outline" size={15} color="#9ca3af" />
              <Text style={{ color: '#6b7280', fontSize: 13 }}>
                {pharmacy.isOpen24h ? '24h/24 · 7j/7' : `${pharmacy.openTime} – ${pharmacy.closeTime}`}
              </Text>
            </View>
            {pharmacy.rating > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="star" size={15} color="#facc15" />
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151' }}>{pharmacy.rating.toFixed(1)}</Text>
                <Text style={{ fontSize: 12, color: '#9ca3af' }}>({pharmacy.reviewCount} avis)</Text>
              </View>
            )}
          </View>
        </View>

        {/* Services */}
        <View style={{ backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 20, padding: 20, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3, marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 }}>Services</Text>
          {[
            'Médicaments sur ordonnance',
            'Produits parapharmaceutiques',
            'Conseil pharmaceutique',
            'Tests rapides (Malaria, COVID...)',
            ...(pharmacy.isOpen24h ? ['Disponible 24h/24 · 7j/7'] : []),
          ].map((s, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: i < 3 ? 1 : 0, borderBottomColor: '#f9fafb' }}>
              <View style={{ width: 28, height: 28, backgroundColor: '#d1fae5', borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="checkmark" size={16} color="#059669" />
              </View>
              <Text style={{ fontSize: 14, color: '#374151' }}>{s}</Text>
            </View>
          ))}
        </View>

        {/* Contact actions */}
        <View style={{ marginHorizontal: 16, gap: 12, marginBottom: 32 }}>
          {pharmacy.phone && (
            <TouchableOpacity
              onPress={() => Linking.openURL(`tel:${pharmacy.phone}`)}
              style={{ backgroundColor: '#059669', borderRadius: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}
            >
              <Ionicons name="call" size={20} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Appeler maintenant</Text>
            </TouchableOpacity>
          )}
          {pharmacy.phone && (
            <TouchableOpacity
              onPress={() => Linking.openURL(`https://wa.me/${pharmacy.phone?.replace(/\D/g, '')}`)}
              style={{ backgroundColor: '#25d366', borderRadius: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}
            >
              <Ionicons name="logo-whatsapp" size={20} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Contacter sur WhatsApp</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
