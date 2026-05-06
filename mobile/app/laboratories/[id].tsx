import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, SafeAreaView,
  ActivityIndicator, Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';

const T = '#0d9488';

interface Laboratory {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  city: string;
  address?: string;
  isOpen24h: boolean;
  openTime?: string;
  closeTime?: string;
  analyses?: string[];
  services?: string[];
  rating: number;
  reviewCount: number;
  isVerified: boolean;
}

function isOpenNow(lab: Laboratory) {
  if (lab.isOpen24h) return true;
  if (!lab.openTime || !lab.closeTime) return false;
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const [oh, om] = lab.openTime.split(':').map(Number);
  const [ch, cm] = lab.closeTime.split(':').map(Number);
  return cur >= oh * 60 + om && cur < ch * 60 + cm;
}

export default function LabDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [lab, setLab] = useState<Laboratory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/laboratories/${id}`)
      .then(res => setLab(res.data.laboratory || res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' }}>
        <ActivityIndicator color={T} size="large" />
      </SafeAreaView>
    );
  }
  if (!lab) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb', padding: 32 }}>
        <Ionicons name="flask-outline" size={48} color="#d1d5db" />
        <Text style={{ color: '#6b7280', marginTop: 12, fontSize: 16 }}>Laboratoire introuvable</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: T, fontWeight: '700' }}>← Retour</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const open = isOpenNow(lab);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ backgroundColor: T, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '600' }}>Retour</Text>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={{ width: 60, height: 60, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 30 }}>🧪</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900' }}>{lab.name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                {lab.isVerified && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Ionicons name="checkmark-circle" size={12} color="#fff" />
                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>Vérifié</Text>
                  </View>
                )}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: open ? 'rgba(52,211,153,0.25)' : 'rgba(239,68,68,0.25)', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: open ? '#34d399' : '#ef4444' }} />
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{open ? 'Ouvert' : 'Fermé'}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={{ padding: 20, gap: 14, marginTop: -12 }}>
          {/* Rating & info card */}
          <View style={{ backgroundColor: '#fff', borderRadius: 18, padding: 18, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <Ionicons name="star" size={16} color="#fbbf24" />
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#0f172a' }}>{(lab.rating || 0).toFixed(1)}</Text>
              <Text style={{ color: '#94a3b8', fontSize: 13 }}>({lab.reviewCount || 0} avis)</Text>
            </View>
            {lab.city && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Ionicons name="location-outline" size={16} color="#94a3b8" />
                <Text style={{ color: '#475569', fontSize: 14 }}>{lab.city}{lab.address ? `, ${lab.address}` : ''}</Text>
              </View>
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="time-outline" size={16} color="#94a3b8" />
              <Text style={{ color: '#475569', fontSize: 14 }}>
                {lab.isOpen24h ? 'Ouvert 24h/24 — 7j/7' : `${lab.openTime || '07:00'} – ${lab.closeTime || '18:00'}`}
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {lab.phone && (
              <TouchableOpacity
                onPress={() => Linking.openURL(`tel:${lab.phone}`)}
                style={{ flex: 1, backgroundColor: T, borderRadius: 14, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
              >
                <Ionicons name="call" size={18} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Appeler</Text>
              </TouchableOpacity>
            )}
            {lab.phone && (
              <TouchableOpacity
                onPress={() => Linking.openURL(`https://wa.me/${lab.phone?.replace(/\D/g, '')}`)}
                style={{ flex: 1, backgroundColor: '#25D366', borderRadius: 14, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
              >
                <Ionicons name="logo-whatsapp" size={18} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>WhatsApp</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Analyses */}
          {lab.analyses && lab.analyses.length > 0 && (
            <View style={{ backgroundColor: '#fff', borderRadius: 18, padding: 18, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#0f172a', marginBottom: 12 }}>Analyses disponibles</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {lab.analyses.map((a, i) => (
                  <View key={i} style={{ backgroundColor: '#f0fdfa', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#99f6e4' }}>
                    <Text style={{ color: T, fontSize: 13, fontWeight: '600' }}>{a}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Services */}
          {lab.services && lab.services.length > 0 && (
            <View style={{ backgroundColor: '#fff', borderRadius: 18, padding: 18, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#0f172a', marginBottom: 12 }}>Services</Text>
              {lab.services.map((s, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <Ionicons name="checkmark-circle" size={16} color={T} />
                  <Text style={{ color: '#475569', fontSize: 14 }}>{s}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Contact */}
          {(lab.phone || lab.email) && (
            <View style={{ backgroundColor: '#fff', borderRadius: 18, padding: 18, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#0f172a', marginBottom: 12 }}>Contact</Text>
              {lab.phone && (
                <TouchableOpacity onPress={() => Linking.openURL(`tel:${lab.phone}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <Ionicons name="call-outline" size={16} color={T} />
                  <Text style={{ color: T, fontSize: 14, fontWeight: '600' }}>{lab.phone}</Text>
                </TouchableOpacity>
              )}
              {lab.email && (
                <TouchableOpacity onPress={() => Linking.openURL(`mailto:${lab.email}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Ionicons name="mail-outline" size={16} color={T} />
                  <Text style={{ color: T, fontSize: 14, fontWeight: '600' }}>{lab.email}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
