import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';
import { saveToken, saveUser } from '@/lib/auth';

export default function VerifyOTPScreen() {
  const router = useRouter();
  const { userId, contact, contactMethod } = useLocalSearchParams<{
    userId: string;
    contact: string;
    contactMethod: 'email' | 'phone';
  }>();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const inputs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      Alert.alert('Erreur', 'Veuillez entrer les 6 chiffres du code');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { userId, otp: code });
      const { token, user } = res.data;
      if (token) {
        await saveToken(token);
        await saveUser(user);
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/login');
      }
    } catch (e: any) {
      const msg = e?.response?.data?.error || 'Code incorrect. Veuillez réessayer.';
      Alert.alert('Erreur', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      await api.post('/auth/resend-otp', { userId });
      setResendTimer(60);
      setOtp(['', '', '', '', '', '']);
      Alert.alert('Code envoyé', 'Un nouveau code a été envoyé.');
    } catch (e: any) {
      Alert.alert('Erreur', 'Impossible de renvoyer le code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#f0fdfa' }}
    >
      <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
        {/* Header */}
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <View style={{ width: 56, height: 56, backgroundColor: '#0d9488', borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 20 }}>GS</Text>
          </View>
          <Text style={{ fontSize: 24, fontWeight: '800', color: '#134e4a' }}>Vérification</Text>
          <Text style={{ color: '#6b7280', marginTop: 4, textAlign: 'center' }}>
            Entrez le code reçu par {contactMethod === 'email' ? 'email' : 'SMS'}
          </Text>
        </View>

        <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 24, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 }}>
          {/* Contact info */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f0fdfa', borderRadius: 12, padding: 14, marginBottom: 24 }}>
            <Ionicons
              name={contactMethod === 'email' ? 'mail-outline' : 'phone-portrait-outline'}
              size={22}
              color="#0d9488"
            />
            <View>
              <Text style={{ fontSize: 12, color: '#6b7280' }}>
                Code envoyé {contactMethod === 'email' ? 'à' : 'au'}
              </Text>
              <Text style={{ fontWeight: '700', color: '#111827' }}>{contact}</Text>
            </View>
          </View>

          {/* OTP inputs */}
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 12 }}>
            Code de vérification (6 chiffres)
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 }}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(r) => { inputs.current[index] = r; }}
                value={digit}
                onChangeText={(v) => handleChange(index, v)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
                keyboardType="number-pad"
                maxLength={1}
                style={{
                  width: 46, height: 56,
                  borderWidth: 2,
                  borderColor: digit ? '#0d9488' : '#e5e7eb',
                  borderRadius: 12,
                  textAlign: 'center',
                  fontSize: 24,
                  fontWeight: '800',
                  color: '#111827',
                  backgroundColor: digit ? '#f0fdfa' : '#fff',
                }}
              />
            ))}
          </View>

          {/* Valider */}
          <TouchableOpacity
            onPress={handleVerify}
            disabled={loading || otp.join('').length !== 6}
            style={{
              backgroundColor: (loading || otp.join('').length !== 6) ? '#9ca3af' : '#0d9488',
              borderRadius: 12, paddingVertical: 16,
              alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8,
            }}
          >
            {loading && <ActivityIndicator color="#fff" size="small" />}
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
              {loading ? 'Vérification...' : 'Valider mon compte'}
            </Text>
          </TouchableOpacity>

          {/* Renvoi */}
          <View style={{ alignItems: 'center', marginTop: 20 }}>
            {resendTimer > 0 ? (
              <Text style={{ color: '#6b7280', fontSize: 13 }}>
                Renvoyer dans <Text style={{ color: '#0d9488', fontWeight: '700' }}>{resendTimer}s</Text>
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResend} disabled={loading}>
                <Text style={{ color: '#0d9488', fontWeight: '700', fontSize: 14 }}>
                  Renvoyer le code
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
