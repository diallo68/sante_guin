import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, TextInput, Alert, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';

const T = '#0d9488';

interface Cabinet {
  _id?: string;
  type?: string;
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  description?: string;
  openTime?: string;
  closeTime?: string;
  isOpen24h?: boolean;
  rating?: number;
  reviewCount?: number;
  isVerified?: boolean;
  specialties?: string[];
  services?: string[];
  analyses?: string[];
}

export default function ProCabinetScreen() {
  const router = useRouter();
  const [cabinet, setCabinet] = useState<Cabinet | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Cabinet>>({});

  useEffect(() => {
    api.get('/pro/cabinet')
      .then(res => {
        // L'API renvoie { profile }, pas { cabinet } — voir audit B12.
        const c = res.data.profile || res.data;
        setCabinet(c);
        setForm(c || {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const startEdit = () => { setForm({ ...cabinet }); setEditing(true); };
  const cancelEdit = () => { setEditing(false); };

  const save = async () => {
    setSaving(true);
    try {
      const res = await api.put('/pro/cabinet', form);
      const updated = res.data.profile || res.data;
      setCabinet(updated);
      setEditing(false);
      Alert.alert('Succès', 'Établissement mis à jour.');
    } catch {
      Alert.alert('Erreur', 'Impossible de sauvegarder les modifications.');
    } finally {
      setSaving(false);
    }
  };

  const typeLabel = (t?: string) => ({ doctor: 'Cabinet médical', pharmacy: 'Pharmacie', laboratory: 'Laboratoire' }[t || ''] || t || 'Établissement');

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
        <View style={{ backgroundColor: T, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '600' }}>Retour</Text>
            </TouchableOpacity>
            {!editing ? (
              <TouchableOpacity onPress={startEdit} style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 7 }}>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Modifier</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity onPress={cancelEdit} style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 7 }}>
                  <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={save} disabled={saving} style={{ backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 7 }}>
                  {saving ? <ActivityIndicator color={T} size="small" /> : <Text style={{ color: T, fontWeight: '800', fontSize: 13 }}>Sauvegarder</Text>}
                </TouchableOpacity>
              </View>
            )}
          </View>
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900' }}>Mon établissement</Text>
          {cabinet?.type && <Text style={{ color: '#99f6e4', fontSize: 13, marginTop: 2 }}>{typeLabel(cabinet.type)}</Text>}
        </View>

        <View style={{ padding: 16, gap: 14 }}>
          {!cabinet ? (
            <View style={{ alignItems: 'center', paddingVertical: 60 }}>
              <Ionicons name="business-outline" size={48} color="#d1d5db" />
              <Text style={{ color: '#94a3b8', marginTop: 12, fontSize: 15, textAlign: 'center' }}>
                Aucun établissement configuré.{'\n'}Créez votre profil professionnel sur le site web.
              </Text>
            </View>
          ) : (
            <>
              {/* Identity card */}
              <View style={{ backgroundColor: '#fff', borderRadius: 18, padding: 18, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                  <Ionicons name="business" size={16} color={T} />
                  <Text style={{ fontSize: 12, fontWeight: '800', color: T, letterSpacing: 1, textTransform: 'uppercase' }}>Identité</Text>
                  {cabinet.isVerified && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#f0fdfa', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 6 }}>
                      <Ionicons name="checkmark-circle" size={11} color={T} />
                      <Text style={{ fontSize: 10, fontWeight: '700', color: T }}>Vérifié</Text>
                    </View>
                  )}
                </View>
                {[
                  { label: 'Nom', key: 'name', placeholder: 'Nom de l\'établissement' },
                  { label: 'Téléphone', key: 'phone', placeholder: '+224...', kb: 'phone-pad' },
                  { label: 'Email', key: 'email', placeholder: 'email@exemple.com', kb: 'email-address' },
                  { label: 'Adresse', key: 'address', placeholder: 'Adresse complète' },
                  { label: 'Description', key: 'description', placeholder: 'Décrivez votre établissement', multi: true },
                ].map(f => (
                  <View key={f.key} style={{ marginBottom: 12 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#94a3b8', marginBottom: 4 }}>{f.label}</Text>
                    {editing ? (
                      <TextInput
                        value={(form as any)[f.key] || ''}
                        onChangeText={v => setForm(prev => ({ ...prev, [f.key]: v }))}
                        placeholder={f.placeholder}
                        keyboardType={(f.kb as any) || 'default'}
                        multiline={!!f.multi}
                        style={{ backgroundColor: '#f8fafc', borderRadius: 10, borderWidth: 1.5, borderColor: '#e2e8f0', paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#0f172a', minHeight: f.multi ? 70 : undefined, textAlignVertical: f.multi ? 'top' : undefined }}
                      />
                    ) : (
                      <Text style={{ fontSize: 14, color: '#475569' }}>{(cabinet as any)[f.key] || '—'}</Text>
                    )}
                  </View>
                ))}
              </View>

              {/* Hours card */}
              <View style={{ backgroundColor: '#fff', borderRadius: 18, padding: 18, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                  <Ionicons name="time" size={16} color={T} />
                  <Text style={{ fontSize: 12, fontWeight: '800', color: T, letterSpacing: 1, textTransform: 'uppercase' }}>Horaires</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#475569' }}>Ouvert 24h/24</Text>
                  {editing ? (
                    <Switch
                      value={!!form.isOpen24h}
                      onValueChange={v => setForm(prev => ({ ...prev, isOpen24h: v }))}
                      trackColor={{ false: '#e2e8f0', true: '#99f6e4' }}
                      thumbColor={form.isOpen24h ? T : '#94a3b8'}
                    />
                  ) : (
                    <Text style={{ fontSize: 14, color: cabinet.isOpen24h ? T : '#64748b', fontWeight: '700' }}>{cabinet.isOpen24h ? 'Oui' : 'Non'}</Text>
                  )}
                </View>
                {(!form.isOpen24h || !editing) && !cabinet.isOpen24h && (
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    {[{ label: 'Ouverture', key: 'openTime' }, { label: 'Fermeture', key: 'closeTime' }].map(f => (
                      <View key={f.key} style={{ flex: 1 }}>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: '#94a3b8', marginBottom: 4 }}>{f.label}</Text>
                        {editing ? (
                          <TextInput
                            value={(form as any)[f.key] || ''}
                            onChangeText={v => setForm(prev => ({ ...prev, [f.key]: v }))}
                            placeholder="08:00"
                            style={{ backgroundColor: '#f8fafc', borderRadius: 10, borderWidth: 1.5, borderColor: '#e2e8f0', paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#0f172a' }}
                          />
                        ) : (
                          <Text style={{ fontSize: 14, color: '#475569' }}>{(cabinet as any)[f.key] || '—'}</Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Stats */}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
                  <Ionicons name="star" size={20} color="#fbbf24" />
                  <Text style={{ fontSize: 22, fontWeight: '900', color: '#0f172a', marginTop: 4 }}>{(cabinet.rating || 0).toFixed(1)}</Text>
                  <Text style={{ fontSize: 11, color: '#64748b' }}>Note moyenne</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
                  <Ionicons name="chatbubble-outline" size={20} color={T} />
                  <Text style={{ fontSize: 22, fontWeight: '900', color: '#0f172a', marginTop: 4 }}>{cabinet.reviewCount || 0}</Text>
                  <Text style={{ fontSize: 11, color: '#64748b' }}>Avis</Text>
                </View>
              </View>

              {/* Specialties/Analyses */}
              {((cabinet.specialties?.length || 0) > 0 || (cabinet.analyses?.length || 0) > 0 || (cabinet.services?.length || 0) > 0) && (
                <View style={{ backgroundColor: '#fff', borderRadius: 18, padding: 18, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 }}>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: T, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>
                    {cabinet.type === 'laboratory' ? 'Analyses' : cabinet.type === 'pharmacy' ? 'Services' : 'Spécialités'}
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {[...(cabinet.specialties || []), ...(cabinet.services || []), ...(cabinet.analyses || [])].map((s, i) => (
                      <View key={i} style={{ backgroundColor: '#f0fdfa', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: '#99f6e4' }}>
                        <Text style={{ color: T, fontSize: 12, fontWeight: '600' }}>{s}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
