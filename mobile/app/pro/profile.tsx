import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';

const T = '#0d9488';

interface ProProfile {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  specialty?: string;
  consultationFee?: number;
  bio?: string;
  city?: string;
  address?: string;
  isVerified?: boolean;
}

export default function ProProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ProProfile>({});
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api.get('/pro/profile')
      .then(res => {
        const p = res.data.profile || res.data;
        setProfile(p);
        setForm(p || {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await api.put('/pro/profile', form);
      const updated = res.data.profile || res.data;
      setProfile(updated);
      setEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      Alert.alert('Erreur', 'Impossible de mettre à jour le profil.');
    } finally {
      setSaving(false);
    }
  };

  const FIELDS = [
    { key: 'firstName', label: 'Prénom' },
    { key: 'lastName', label: 'Nom' },
    { key: 'email', label: 'Email', kb: 'email-address' },
    { key: 'phone', label: 'Téléphone', kb: 'phone-pad' },
    { key: 'specialty', label: 'Spécialité' },
    { key: 'consultationFee', label: 'Tarif consultation (GNF)', kb: 'numeric' },
    { key: 'city', label: 'Ville' },
    { key: 'address', label: 'Adresse' },
    { key: 'bio', label: 'Biographie', multi: true },
  ];

  const initials = profile ? `${profile.firstName?.[0] || ''}${profile.lastName?.[0] || ''}` : 'PR';

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
        <ActivityIndicator color={T} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View style={{ backgroundColor: T, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '600' }}>Retour</Text>
            </TouchableOpacity>
            {!editing ? (
              <TouchableOpacity onPress={() => setEditing(true)} style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 7 }}>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Modifier</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity onPress={() => { setEditing(false); setForm(profile || {}); }} style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 7 }}>
                  <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={save} disabled={saving} style={{ backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 7 }}>
                  {saving ? <ActivityIndicator color={T} size="small" /> : <Text style={{ color: T, fontWeight: '800', fontSize: 13 }}>Sauvegarder</Text>}
                </TouchableOpacity>
              </View>
            )}
          </View>
          {/* Avatar */}
          <View style={{ alignItems: 'center' }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
              <Text style={{ fontSize: 30, fontWeight: '900', color: '#fff' }}>{initials.toUpperCase()}</Text>
            </View>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900' }}>
              {profile?.firstName} {profile?.lastName}
            </Text>
            {profile?.specialty && <Text style={{ color: '#99f6e4', fontSize: 14, marginTop: 2 }}>{profile.specialty}</Text>}
            {profile?.isVerified && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, marginTop: 8 }}>
                <Ionicons name="checkmark-circle" size={13} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Vérifié</Text>
              </View>
            )}
          </View>
        </View>

        <View style={{ padding: 16, marginTop: -20, gap: 14 }}>
          {success && (
            <View style={{ backgroundColor: '#f0fdfa', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#99f6e4' }}>
              <Ionicons name="checkmark-circle" size={20} color={T} />
              <Text style={{ color: T, fontWeight: '700', fontSize: 14 }}>Profil mis à jour avec succès</Text>
            </View>
          )}

          <View style={{ backgroundColor: '#fff', borderRadius: 18, padding: 18, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, gap: 14 }}>
            {FIELDS.map(f => (
              <View key={f.key}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#94a3b8', marginBottom: 5 }}>{f.label}</Text>
                {editing ? (
                  <TextInput
                    value={String((form as any)[f.key] || '')}
                    onChangeText={v => setForm(prev => ({ ...prev, [f.key]: f.kb === 'numeric' ? Number(v) || v : v }))}
                    keyboardType={(f.kb as any) || 'default'}
                    multiline={!!f.multi}
                    style={{ backgroundColor: '#f8fafc', borderRadius: 10, borderWidth: 1.5, borderColor: '#e2e8f0', paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#0f172a', minHeight: f.multi ? 80 : undefined, textAlignVertical: f.multi ? 'top' : undefined }}
                  />
                ) : (
                  <Text style={{ fontSize: 14, color: (profile as any)?.[f.key] ? '#0f172a' : '#94a3b8' }}>
                    {(profile as any)?.[f.key] ? String((profile as any)[f.key]) : 'Non renseigné'}
                  </Text>
                )}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
