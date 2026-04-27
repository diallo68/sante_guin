import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!identifier.trim() || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }
    setLoading(true);
    try {
      await login(identifier.trim(), password);
      router.replace('/(tabs)');
    } catch (e: any) {
      const msg = e?.response?.data?.error || 'Identifiants incorrects.';
      Alert.alert('Connexion échouée', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#f0fdfa' }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
        {/* Logo */}
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <View style={{ width: 64, height: 64, backgroundColor: '#0d9488', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 22 }}>GS</Text>
          </View>
          <Text style={{ fontSize: 26, fontWeight: '800', color: '#134e4a' }}>Guinée Santé</Text>
          <Text style={{ color: '#6b7280', marginTop: 4 }}>Connectez-vous à votre compte</Text>
        </View>

        {/* Form */}
        <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 24, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 20 }}>Connexion</Text>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 }}>Email ou Téléphone</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 12 }}>
              <Ionicons name="person-outline" size={18} color="#9ca3af" />
              <TextInput
                value={identifier}
                onChangeText={setIdentifier}
                placeholder="votre@email.com ou +224..."
                placeholderTextColor="#9ca3af"
                autoCapitalize="none"
                keyboardType="email-address"
                style={{ flex: 1, paddingVertical: 14, paddingLeft: 8, fontSize: 15, color: '#111827' }}
              />
            </View>
          </View>

          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 }}>Mot de passe</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 12 }}>
              <Ionicons name="lock-closed-outline" size={18} color="#9ca3af" />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showPassword}
                style={{ flex: 1, paddingVertical: 14, paddingLeft: 8, fontSize: 15, color: '#111827' }}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9ca3af" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            style={{ backgroundColor: loading ? '#9ca3af' : '#0d9488', borderRadius: 12, paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
          >
            {loading && <ActivityIndicator color="#fff" size="small" />}
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24, gap: 4 }}>
          <Text style={{ color: '#6b7280' }}>Pas encore de compte ?</Text>
          <Link href="/(auth)/signup">
            <Text style={{ color: '#0d9488', fontWeight: '700' }}>S'inscrire</Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
