import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

export default function ProfileEditScreen() {
  const router = useRouter();
  const { user, refresh } = useAuth();

  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      Alert.alert('Erreur', 'Prénom et nom sont requis');
      return;
    }
    setSaving(true);
    try {
      await api.put('/auth/profile', form);
      await refresh();
      Alert.alert('Succès', 'Profil mis à jour', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Erreur', e.response?.data?.error || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={{ backgroundColor: '#0d9488', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ width: 36, height: 36, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>Modifier le profil</Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled">
          <View style={{ backgroundColor: '#fff', borderRadius: 18, padding: 20, gap: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
            {/* Prénom */}
            <View>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 }}>Prénom *</Text>
              <TextInput
                value={form.firstName}
                onChangeText={t => setForm({ ...form, firstName: t })}
                placeholder="Votre prénom"
                placeholderTextColor="#9ca3af"
                style={{ borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827', backgroundColor: '#fafafa' }}
              />
            </View>

            {/* Nom */}
            <View>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 }}>Nom *</Text>
              <TextInput
                value={form.lastName}
                onChangeText={t => setForm({ ...form, lastName: t })}
                placeholder="Votre nom"
                placeholderTextColor="#9ca3af"
                style={{ borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827', backgroundColor: '#fafafa' }}
              />
            </View>

            {/* Téléphone */}
            <View>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 }}>
                Téléphone <Text style={{ color: '#9ca3af', fontWeight: '400' }}>(optionnel)</Text>
              </Text>
              <TextInput
                value={form.phone}
                onChangeText={t => setForm({ ...form, phone: t })}
                placeholder="+224 6XX XXX XXX"
                placeholderTextColor="#9ca3af"
                keyboardType="phone-pad"
                style={{ borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827', backgroundColor: '#fafafa' }}
              />
            </View>
          </View>

          {/* Bouton */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={{ backgroundColor: saving ? '#9ca3af' : '#0d9488', borderRadius: 14, paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
          >
            {saving
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="checkmark-circle" size={20} color="#fff" />
            }
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
