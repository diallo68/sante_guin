import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';

const T = '#0d9488';

type Method = 'email' | 'phone';
type Step = 1 | 2 | 3 | 4 | 5;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [method, setMethod] = useState<Method>('email');
  const [contact, setContact] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const otpRefs = useRef<(TextInput | null)[]>([]);

  const handleStep2 = async () => {
    if (!contact.trim()) return Alert.alert('Requis', 'Entrez votre email ou téléphone');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password/request', { method, contact: contact.trim() });
      setStep(3);
    } catch {
      Alert.alert('Erreur', 'Identifiant introuvable. Vérifiez et réessayez.');
    } finally {
      setLoading(false);
    }
  };

  const handleStep3 = async () => {
    const code = otp.join('');
    if (code.length < 6) return Alert.alert('Requis', 'Entrez le code à 6 chiffres');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password/verify', { method, contact, otp: code });
      setStep(4);
    } catch {
      Alert.alert('Code incorrect', 'Vérifiez le code reçu et réessayez.');
    } finally {
      setLoading(false);
    }
  };

  const handleStep4 = async () => {
    if (!password || password.length < 6) return Alert.alert('Requis', 'Le mot de passe doit faire au moins 6 caractères');
    if (password !== confirm) return Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password/reset', { method, contact, otp: otp.join(''), newPassword: password });
      setStep(5);
    } catch {
      Alert.alert('Erreur', 'Impossible de réinitialiser le mot de passe.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (val: string, index: number) => {
    const updated = [...otp];
    updated[index] = val.slice(-1);
    setOtp(updated);
    if (val && index < 5) otpRefs.current[index + 1]?.focus();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#f9fafb' }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={{ backgroundColor: T, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 40 }}>
          {step < 5 && (
            <TouchableOpacity onPress={() => step === 1 ? router.back() : setStep((step - 1) as Step)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 }}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '600' }}>Retour</Text>
            </TouchableOpacity>
          )}
          <Text style={{ color: '#fff', fontSize: 26, fontWeight: '900' }}>Mot de passe oublié</Text>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 6 }}>
            {step === 1 && 'Choisissez comment réinitialiser'}
            {step === 2 && 'Entrez votre identifiant'}
            {step === 3 && 'Vérifiez votre code'}
            {step === 4 && 'Créez un nouveau mot de passe'}
            {step === 5 && 'Mot de passe réinitialisé !'}
          </Text>
          {/* Progress dots */}
          {step < 5 && (
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 16 }}>
              {[1, 2, 3, 4].map(n => (
                <View key={n} style={{ height: 4, flex: 1, borderRadius: 2, backgroundColor: n <= step ? '#fff' : 'rgba(255,255,255,0.3)' }} />
              ))}
            </View>
          )}
        </View>

        <View style={{ padding: 24, flex: 1 }}>
          {/* STEP 1 — Method */}
          {step === 1 && (
            <View style={{ gap: 14 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 4 }}>Comment souhaitez-vous récupérer votre compte ?</Text>
              {(['email', 'phone'] as Method[]).map(m => (
                <TouchableOpacity
                  key={m}
                  onPress={() => setMethod(m)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 2, borderColor: method === m ? T : '#e2e8f0' }}
                >
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: method === m ? '#f0fdfa' : '#f8fafc', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name={m === 'email' ? 'mail' : 'phone-portrait'} size={22} color={method === m ? T : '#94a3b8'} />
                  </View>
                  <View>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#1e293b' }}>{m === 'email' ? 'Par email' : 'Par SMS'}</Text>
                    <Text style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{m === 'email' ? 'Recevoir un code par email' : 'Recevoir un code par SMS'}</Text>
                  </View>
                  {method === m && <Ionicons name="checkmark-circle" size={22} color={T} style={{ marginLeft: 'auto' }} />}
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                onPress={() => setStep(2)}
                style={{ backgroundColor: T, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 }}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Continuer</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2 — Contact */}
          {step === 2 && (
            <View style={{ gap: 14 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#1e293b' }}>
                {method === 'email' ? 'Votre adresse email' : 'Votre numéro de téléphone'}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: '#e2e8f0', paddingHorizontal: 14 }}>
                <Ionicons name={method === 'email' ? 'mail-outline' : 'phone-portrait-outline'} size={18} color="#94a3b8" />
                <TextInput
                  value={contact}
                  onChangeText={setContact}
                  placeholder={method === 'email' ? 'exemple@email.com' : '+224 6XX XXX XXX'}
                  keyboardType={method === 'email' ? 'email-address' : 'phone-pad'}
                  autoCapitalize="none"
                  style={{ flex: 1, paddingVertical: 14, paddingLeft: 10, fontSize: 15, color: '#0f172a' }}
                />
              </View>
              <TouchableOpacity
                onPress={handleStep2}
                disabled={loading}
                style={{ backgroundColor: T, borderRadius: 14, paddingVertical: 16, alignItems: 'center' }}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Envoyer le code</Text>}
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 3 — OTP */}
          {step === 3 && (
            <View style={{ gap: 20 }}>
              <Text style={{ fontSize: 15, color: '#64748b', lineHeight: 22 }}>
                Un code à 6 chiffres a été envoyé à <Text style={{ fontWeight: '700', color: '#1e293b' }}>{contact}</Text>
              </Text>
              <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'center' }}>
                {otp.map((digit, i) => (
                  <TextInput
                    key={i}
                    ref={ref => { otpRefs.current[i] = ref; }}
                    value={digit}
                    onChangeText={v => handleOtpChange(v, i)}
                    keyboardType="number-pad"
                    maxLength={1}
                    style={{ width: 48, height: 56, borderRadius: 12, borderWidth: 2, borderColor: digit ? T : '#e2e8f0', backgroundColor: '#fff', textAlign: 'center', fontSize: 22, fontWeight: '800', color: '#0f172a' }}
                  />
                ))}
              </View>
              <TouchableOpacity
                onPress={handleStep3}
                disabled={loading}
                style={{ backgroundColor: T, borderRadius: 14, paddingVertical: 16, alignItems: 'center' }}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Vérifier le code</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setOtp(['', '', '', '', '', '']); handleStep2(); }} style={{ alignItems: 'center' }}>
                <Text style={{ color: T, fontWeight: '600' }}>Renvoyer le code</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 4 — New password */}
          {step === 4 && (
            <View style={{ gap: 14 }}>
              {[
                { label: 'Nouveau mot de passe', value: password, onChange: setPassword },
                { label: 'Confirmer le mot de passe', value: confirm, onChange: setConfirm },
              ].map(field => (
                <View key={field.label}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 }}>{field.label}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: '#e2e8f0', paddingHorizontal: 14 }}>
                    <Ionicons name="lock-closed-outline" size={18} color="#94a3b8" />
                    <TextInput
                      value={field.value}
                      onChangeText={field.onChange}
                      secureTextEntry
                      style={{ flex: 1, paddingVertical: 14, paddingLeft: 10, fontSize: 15, color: '#0f172a' }}
                    />
                  </View>
                </View>
              ))}
              <TouchableOpacity
                onPress={handleStep4}
                disabled={loading}
                style={{ backgroundColor: T, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 }}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Réinitialiser</Text>}
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 5 — Success */}
          {step === 5 && (
            <View style={{ alignItems: 'center', paddingTop: 40, gap: 20 }}>
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#f0fdfa', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="checkmark-circle" size={50} color={T} />
              </View>
              <Text style={{ fontSize: 22, fontWeight: '900', color: '#0f172a', textAlign: 'center' }}>Mot de passe réinitialisé !</Text>
              <Text style={{ fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 22 }}>
                Votre mot de passe a été mis à jour avec succès. Vous pouvez maintenant vous connecter.
              </Text>
              <TouchableOpacity
                onPress={() => router.replace('/(auth)/login')}
                style={{ backgroundColor: T, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 40, marginTop: 10 }}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Se connecter</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
