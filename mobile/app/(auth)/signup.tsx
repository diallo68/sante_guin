import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';
import { saveToken, saveUser } from '@/lib/auth';

export default function SignupScreen() {
  const router = useRouter();
  const [userType, setUserType] = useState<'patient' | 'doctor'>('patient');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/signup', {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: userType === 'doctor' ? 'doctor' : 'patient',
      });
      const { token, user } = res.data;
      if (token) {
        await saveToken(token);
        await saveUser(user);
        router.replace('/(tabs)');
      } else {
        Alert.alert('Compte créé !', 'Vous pouvez maintenant vous connecter.');
        router.replace('/(auth)/login');
      }
    } catch (e: any) {
      const msg = e?.response?.data?.error || 'Erreur lors de l\'inscription.';
      Alert.alert('Erreur', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#f0fdfa' }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24 }}>
        <View style={{ alignItems: 'center', marginTop: 40, marginBottom: 32 }}>
          <View style={{ width: 56, height: 56, backgroundColor: '#0d9488', borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 20 }}>GS</Text>
          </View>
          <Text style={{ fontSize: 24, fontWeight: '800', color: '#134e4a' }}>Inscription</Text>
          <Text style={{ color: '#6b7280', marginTop: 4 }}>Créez votre compte Guinée Santé</Text>
        </View>

        {/* Type selector */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
          {[
            { key: 'patient', label: 'Patient', icon: 'person' },
            { key: 'doctor', label: 'Professionnel', icon: 'medkit' },
          ].map(t => (
            <TouchableOpacity
              key={t.key}
              onPress={() => setUserType(t.key as any)}
              style={{
                flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 2,
                borderColor: userType === t.key ? '#0d9488' : '#e5e7eb',
                backgroundColor: userType === t.key ? '#f0fdfa' : '#fff',
              }}
            >
              <Ionicons name={t.icon as any} size={18} color={userType === t.key ? '#0d9488' : '#9ca3af'} />
              <Text style={{ fontWeight: '700', color: userType === t.key ? '#0d9488' : '#6b7280' }}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 24, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, elevation: 4, gap: 16 }}>
          {/* Names */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 }}>Prénom</Text>
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Mohamed"
                placeholderTextColor="#9ca3af"
                style={{ borderWidth: 2, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827' }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 }}>Nom</Text>
              <TextInput
                value={lastName}
                onChangeText={setLastName}
                placeholder="Diallo"
                placeholderTextColor="#9ca3af"
                style={{ borderWidth: 2, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827' }}
              />
            </View>
          </View>

          {/* Email */}
          <View>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 }}>Email</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 12 }}>
              <Ionicons name="mail-outline" size={18} color="#9ca3af" />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="votre@email.com"
                placeholderTextColor="#9ca3af"
                autoCapitalize="none"
                keyboardType="email-address"
                style={{ flex: 1, paddingVertical: 12, paddingLeft: 8, fontSize: 15, color: '#111827' }}
              />
            </View>
          </View>

          {/* Password */}
          <View>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 }}>Mot de passe</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 12 }}>
              <Ionicons name="lock-closed-outline" size={18} color="#9ca3af" />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Min. 8 caractères"
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showPassword}
                style={{ flex: 1, paddingVertical: 12, paddingLeft: 8, fontSize: 15, color: '#111827' }}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9ca3af" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSignup}
            disabled={loading}
            style={{ backgroundColor: loading ? '#9ca3af' : '#0d9488', borderRadius: 12, paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 4 }}
          >
            {loading && <ActivityIndicator color="#fff" size="small" />}
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
              {loading ? 'Inscription...' : "S'inscrire"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24, gap: 4 }}>
          <Text style={{ color: '#6b7280' }}>Déjà un compte ?</Text>
          <Link href="/(auth)/login">
            <Text style={{ color: '#0d9488', fontWeight: '700' }}>Se connecter</Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
