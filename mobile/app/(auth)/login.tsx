import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Modal, FlatList,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

type Mode     = 'login' | 'register';
type Method   = 'email' | 'phone';
type UserType = 'patient' | 'doctor';
type RegStep  = 'form' | 'otp';

const LOCATIONS = [
  'Kaloum','Dixinn','Matam','Ratoma','Matoto','Coyah','Dubréka','Forécariah',
  'Boffa','Fria','Kindia','Télimélé','Kamsar','Boké','Labé','Mamou','Pita',
  'Dalaba','Mali','Koubia','Lélouma','Tougué','Kankan','Siguiri','Kouroussa',
  'Mandiana','Kérouané','Faranah','Kissidougou','Dinguiraye',"N'Zérékoré",
  'Guéckédou','Macenta','Yomou','Lola','Beyla','Sipilou',
];

const SPECIALTIES = [
  'Médecin généraliste','Cardiologue','Chirurgien-dentiste','Dermatologue',
  'Endocrinologue','Gastroentérologue','Gynécologue','Neurologue','Ophtalmologue',
  'ORL','Orthopédiste','Pédiatre','Pneumologue','Psychiatre','Rhumatologue',
  'Chirurgien','Urologue','Urgentiste','Radiologue','Anesthésiste',
  'Médecine interne','Infectiologue',
];

export default function AuthScreen() {
  const [mode, setMode] = useState<Mode>('login');

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={s.scroll} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View style={s.header}>
          <View style={s.logoWrap}><Text style={s.logoText}>MD</Text></View>
          <Text style={s.appName}>MonDocteur</Text>
          <Text style={s.appSub}>
            {mode === 'login' ? 'Connectez-vous à votre compte' : 'Créez votre compte'}
          </Text>
        </View>

        {mode === 'login'
          ? <LoginForm onCreateAccount={() => setMode('register')} />
          : <RegisterForm onLogin={() => setMode('login')} />
        }
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─────────────────────────────────────────────
// Connexion
// ─────────────────────────────────────────────
function LoginForm({ onCreateAccount }: { onCreateAccount: () => void }) {
  const { login } = useAuth();
  const router = useRouter();
  const [loginMode, setLoginMode] = useState<Method>('email');
  const [identifier, setIdentifier] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const contact = loginMode === 'phone'
      ? '+224' + phone.replace(/\D/g, '')
      : identifier.trim();
    if (!contact || contact === '+224') { Alert.alert('Erreur', 'Entrez votre identifiant'); return; }
    if (!password) { Alert.alert('Erreur', 'Entrez votre mot de passe'); return; }
    setLoading(true);
    try {
      await login(contact, password);
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('Connexion échouée', e?.response?.data?.error || 'Identifiants incorrects.');
    } finally { setLoading(false); }
  };

  return (
    <View style={s.card}>
      {/* Toggle email / téléphone */}
      <View style={s.toggle}>
        {([{ key: 'email', label: '📧 Email' }, { key: 'phone', label: '📱 Téléphone' }] as const).map(m => (
          <TouchableOpacity key={m.key} onPress={() => setLoginMode(m.key)}
            style={[s.toggleBtn, loginMode === m.key && s.toggleBtnActive]}>
            <Text style={[s.toggleLabel, loginMode === m.key && s.toggleLabelActive]}>{m.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loginMode === 'email' ? (
        <View style={s.field}>
          <Text style={s.label}>Email</Text>
          <View style={s.inputRow}>
            <Text style={s.inputIcon}>📧</Text>
            <TextInput value={identifier} onChangeText={setIdentifier}
              placeholder="votre@email.com" placeholderTextColor="#9ca3af"
              autoCapitalize="none" keyboardType="email-address" style={s.inputInner} />
          </View>
        </View>
      ) : (
        <View style={s.field}>
          <Text style={s.label}>Téléphone</Text>
          <View style={s.phoneRow}>
            <View style={s.phonePrefix}><Text style={s.phonePrefixText}>🇬🇳 +224</Text></View>
            <TextInput value={phone} onChangeText={setPhone} placeholder="620 00 00 00"
              placeholderTextColor="#9ca3af" keyboardType="phone-pad" maxLength={9} style={s.phoneInput} />
          </View>
        </View>
      )}

      <View style={s.field}>
        <Text style={s.label}>Mot de passe</Text>
        <View style={s.inputRow}>
          <Text style={s.inputIcon}>🔒</Text>
          <TextInput value={password} onChangeText={setPassword} placeholder="••••••••"
            placeholderTextColor="#9ca3af" secureTextEntry={!showPw} style={s.inputInner} />
          <TouchableOpacity onPress={() => setShowPw(!showPw)}>
            <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color="#9ca3af" />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')} style={{ alignSelf: 'flex-end', marginBottom: 8 }}>
        <Text style={s.forgotText}>Mot de passe oublié ?</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleLogin} disabled={loading} style={[s.btnPrimary, loading && s.btnDisabled]}>
        {loading && <ActivityIndicator color="#fff" size="small" style={{ marginRight: 8 }} />}
        <Text style={s.btnPrimaryText}>{loading ? 'Connexion...' : 'Se connecter'}</Text>
      </TouchableOpacity>

      {/* Séparateur */}
      <View style={s.separator}>
        <View style={s.sepLine} />
        <Text style={s.sepText}>ou</Text>
        <View style={s.sepLine} />
      </View>

      {/* Créer un compte */}
      <TouchableOpacity onPress={onCreateAccount} style={s.btnOutline}>
        <Text style={s.btnOutlineText}>Vous n'avez pas de compte ? Créer</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─────────────────────────────────────────────
// Inscription
// ─────────────────────────────────────────────
function RegisterForm({ onLogin }: { onLogin: () => void }) {
  const [regStep, setRegStep]   = useState<RegStep>('form');
  const [method, setMethod]     = useState<Method>('email');
  const [userType, setUserType] = useState<UserType>('patient');
  const [loading, setLoading]   = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [email,     setEmail]     = useState('');
  const [phone,     setPhone]     = useState('');
  const [password,  setPassword]  = useState('');
  const [password2, setPassword2] = useState('');
  const [showPw,    setShowPw]    = useState(false);
  const [showPw2,   setShowPw2]   = useState(false);
  const [location,  setLocation]  = useState('');
  const [showLocModal,  setShowLocModal]  = useState(false);
  const [showSpecModal, setShowSpecModal] = useState(false);
  const [specialties, setSpecialties]    = useState<string[]>([]);

  // OTP
  const [otp, setOtp]                     = useState(['','','','','','']);
  const [userId, setUserId]               = useState('');
  const [verifyContact, setVerifyContact] = useState('');
  const [otpError, setOtpError]           = useState('');
  const [resendTimer, setResendTimer]     = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const otpRefs  = [
    useRef<TextInput>(null), useRef<TextInput>(null), useRef<TextInput>(null),
    useRef<TextInput>(null), useRef<TextInput>(null), useRef<TextInput>(null),
  ];

  const pwMatch = password && password2 ? password === password2 : null;

  const startTimer = () => {
    setResendTimer(60);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendTimer(t => { if (t <= 1) { clearInterval(timerRef.current!); return 0; } return t - 1; });
    }, 1000);
  };

  const toggleSpec = (sp: string) =>
    setSpecialties(prev => prev.includes(sp) ? prev.filter(x => x !== sp) : [...prev, sp]);

  const handleSendCode = async () => {
    if (!firstName.trim()) { Alert.alert('Erreur', 'Le prénom est requis'); return; }
    if (method === 'email' && !email.trim()) { Alert.alert('Erreur', 'L\'email est requis'); return; }
    if (method === 'phone' && !phone.trim()) { Alert.alert('Erreur', 'Le numéro est requis'); return; }
    if (userType === 'doctor' && specialties.length === 0) { Alert.alert('Erreur', 'Sélectionnez au moins une spécialité'); return; }
    if (userType === 'doctor' && !location) { Alert.alert('Erreur', 'La localisation est requise'); return; }
    if (!password || password.length < 8) { Alert.alert('Erreur', 'Mot de passe : minimum 8 caractères'); return; }
    if (password !== password2) { Alert.alert('Erreur', 'Les mots de passe ne correspondent pas'); return; }

    setLoading(true);
    try {
      const res = await api.post('/auth/signup', {
        firstName: firstName.trim(), lastName: lastName.trim(),
        email:  method === 'email' ? email.trim().toLowerCase() : undefined,
        phone:  method === 'phone' ? '+224' + phone.replace(/\D/g, '') : undefined,
        password,
        role: userType === 'doctor' ? 'doctor' : 'patient',
        specialties: userType === 'doctor' ? specialties : undefined,
        location:    userType === 'doctor' ? location : undefined,
      });
      setUserId(res.data.userId);
      setVerifyContact(res.data.contact);
      startTimer();
      setRegStep('otp');
    } catch (e: any) {
      Alert.alert('Erreur', e?.response?.data?.error || 'Erreur lors de l\'inscription.');
    } finally { setLoading(false); }
  };

  const handleOtpChange = (i: number, v: string) => {
    const d = v.replace(/\D/g,'').slice(-1);
    const n = [...otp]; n[i] = d; setOtp(n); setOtpError('');
    if (d && i < 5) otpRefs[i+1].current?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6) { Alert.alert('Erreur','Entrez le code à 6 chiffres'); return; }
    setLoading(true);
    try {
      await api.post('/auth/verify-otp', { userId, otp: code });
      Alert.alert('Compte créé !','Votre compte est validé. Connectez-vous.',[
        { text: 'OK', onPress: onLogin },
      ]);
    } catch (e: any) { setOtpError(e?.response?.data?.error || 'Code incorrect.'); }
    finally { setLoading(false); }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      await api.post('/auth/resend-otp', { userId });
      startTimer(); setOtp(['','','','','','']); setOtpError('');
    } catch { Alert.alert('Erreur','Impossible de renvoyer le code.'); }
    finally { setLoading(false); }
  };

  // ── OTP ──
  if (regStep === 'otp') {
    return (
      <View style={[s.card, { alignItems: 'center', gap: 16 }]}>
        <View style={s.otpIconWrap}><Text style={s.otpIcon}>{method === 'email' ? '📧' : '📱'}</Text></View>
        <Text style={s.otpTitle}>Code de vérification</Text>
        <Text style={s.otpSub}>Envoyé {method === 'email' ? 'à' : 'au'} {verifyContact}</Text>

        <View style={s.otpRow}>
          {otp.map((d, i) => (
            <TextInput key={i} ref={otpRefs[i]} value={d}
              onChangeText={v => handleOtpChange(i, v)}
              keyboardType="number-pad" maxLength={1}
              style={[s.otpBox, d ? s.otpBoxFilled : null]} />
          ))}
        </View>
        {otpError ? <Text style={s.otpError}>{otpError}</Text> : null}

        <TouchableOpacity onPress={handleVerify} disabled={loading || otp.join('').length < 6}
          style={[s.btnPrimary, (loading || otp.join('').length < 6) && s.btnDisabled, { width: '100%' }]}>
          {loading && <ActivityIndicator color="#fff" size="small" style={{ marginRight: 8 }} />}
          <Text style={s.btnPrimaryText}>{loading ? 'Vérification...' : '✅ Valider et créer mon compte'}</Text>
        </TouchableOpacity>

        <View style={s.otpActions}>
          <TouchableOpacity onPress={() => { setRegStep('form'); setOtp(['','','','','','']); setOtpError(''); }}>
            <Text style={s.otpBack}>← Modifier mes infos</Text>
          </TouchableOpacity>
          <Text style={s.otpDot}>·</Text>
          {resendTimer > 0
            ? <Text style={s.otpTimerText}>Renvoyer dans <Text style={{ color: '#0d9488', fontWeight: '700' }}>{resendTimer}s</Text></Text>
            : <TouchableOpacity onPress={handleResend} disabled={loading}><Text style={s.otpResend}>Renvoyer</Text></TouchableOpacity>
          }
        </View>
      </View>
    );
  }

  // ── Formulaire ──
  return (
    <View style={s.card}>
      {/* Toggle Patient / Médecin */}
      <View style={s.toggle}>
        {([{ key: 'patient', label: '🧑 Patient' }, { key: 'doctor', label: '👨‍⚕️ Médecin/Cabinet' }] as const).map(t => (
          <TouchableOpacity key={t.key} onPress={() => setUserType(t.key)}
            style={[s.toggleBtn, userType === t.key && s.toggleBtnActive]}>
            <Text style={[s.toggleLabel, userType === t.key && s.toggleLabelActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Toggle Email / Téléphone */}
      <View style={[s.toggle, { marginBottom: 16 }]}>
        {([{ key: 'email', label: '📧 Email' }, { key: 'phone', label: '📱 Téléphone' }] as const).map(m => (
          <TouchableOpacity key={m.key} onPress={() => setMethod(m.key)}
            style={[s.toggleBtn, method === m.key && s.toggleBtnActive]}>
            <Text style={[s.toggleLabel, method === m.key && s.toggleLabelActive]}>{m.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Prénom + Nom */}
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={s.label}>Prénom *</Text>
          <TextInput value={firstName} onChangeText={setFirstName} placeholder="Mohamed"
            placeholderTextColor="#9ca3af" style={s.input} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.label}>Nom</Text>
          <TextInput value={lastName} onChangeText={setLastName} placeholder="Diallo"
            placeholderTextColor="#9ca3af" style={s.input} />
        </View>
      </View>

      {method === 'email' && (
        <View style={s.field}>
          <Text style={s.label}>📧 Email *</Text>
          <TextInput value={email} onChangeText={setEmail} placeholder="votre@email.com"
            placeholderTextColor="#9ca3af" keyboardType="email-address" autoCapitalize="none" style={s.input} />
        </View>
      )}
      {method === 'phone' && (
        <View style={s.field}>
          <Text style={s.label}>📱 Téléphone *</Text>
          <View style={s.phoneRow}>
            <View style={s.phonePrefix}><Text style={s.phonePrefixText}>🇬🇳 +224</Text></View>
            <TextInput value={phone} onChangeText={setPhone} placeholder="620 00 00 00"
              placeholderTextColor="#9ca3af" keyboardType="phone-pad" maxLength={9} style={s.phoneInput} />
          </View>
        </View>
      )}

      {userType === 'doctor' && (
        <>
          <View style={s.field}>
            <Text style={s.label}>Spécialité(s) *</Text>
            {specialties.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {specialties.map(sp => (
                  <TouchableOpacity key={sp} onPress={() => toggleSpec(sp)}
                    style={{ backgroundColor: '#ccfbf1', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={{ color: '#0d9488', fontSize: 11, fontWeight: '600' }}>{sp}</Text>
                    <Text style={{ color: '#0d9488', fontSize: 11 }}>✕</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <TouchableOpacity onPress={() => setShowSpecModal(true)} style={s.selectBtn}>
              <Text style={s.selectBtnText}>{specialties.length === 0 ? '+ Ajouter une spécialité' : '+ Ajouter une autre'}</Text>
            </TouchableOpacity>
          </View>

          <View style={s.field}>
            <Text style={s.label}>📍 Localisation *</Text>
            <TouchableOpacity onPress={() => setShowLocModal(true)}
              style={[s.selectBtn, location ? { borderColor: '#0d9488', backgroundColor: '#f0fdfa' } : null]}>
              <Text style={[s.selectBtnText, !location && { color: '#9ca3af' }]}>{location || 'Sélectionnez votre ville...'}</Text>
              <Text style={{ color: '#9ca3af' }}>▾</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <View style={s.field}>
        <Text style={s.label}>🔒 Mot de passe * <Text style={{ color: '#9ca3af', fontWeight: '400' }}>(8 min)</Text></Text>
        <View style={s.inputRow}>
          <TextInput value={password} onChangeText={setPassword} placeholder="••••••••"
            placeholderTextColor="#9ca3af" secureTextEntry={!showPw} style={s.inputInner} />
          <TouchableOpacity onPress={() => setShowPw(!showPw)}>
            <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color="#9ca3af" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={s.field}>
        <Text style={s.label}>🔒 Confirmer *</Text>
        <View style={[s.inputRow, pwMatch === false ? { borderColor: '#ef4444' } : pwMatch === true ? { borderColor: '#22c55e' } : null]}>
          <TextInput value={password2} onChangeText={setPassword2} placeholder="Répétez le mot de passe"
            placeholderTextColor="#9ca3af" secureTextEntry={!showPw2} style={s.inputInner} />
          <TouchableOpacity onPress={() => setShowPw2(!showPw2)}>
            <Ionicons name={showPw2 ? 'eye-off-outline' : 'eye-outline'} size={18} color="#9ca3af" />
          </TouchableOpacity>
        </View>
        {pwMatch === false && <Text style={s.hintError}>❌ Les mots de passe ne correspondent pas</Text>}
        {pwMatch === true  && <Text style={s.hintSuccess}>✅ Correspondent</Text>}
      </View>

      <TouchableOpacity onPress={handleSendCode} disabled={loading}
        style={[s.btnPrimary, loading && s.btnDisabled]}>
        {loading && <ActivityIndicator color="#fff" size="small" style={{ marginRight: 8 }} />}
        <Text style={s.btnPrimaryText}>
          {loading ? 'Envoi...' : `${method === 'email' ? '📧' : '📱'} Recevoir le code de vérification →`}
        </Text>
      </TouchableOpacity>

      <View style={s.switchRow}>
        <Text style={s.switchText}>Déjà un compte ?</Text>
        <TouchableOpacity onPress={onLogin}><Text style={s.switchLink}> Se connecter</Text></TouchableOpacity>
      </View>

      {/* Modal spécialités */}
      <Modal visible={showSpecModal} transparent animationType="slide" onRequestClose={() => setShowSpecModal(false)}>
        <TouchableOpacity style={s.modalBackdrop} activeOpacity={1} onPress={() => setShowSpecModal(false)} />
        <View style={s.modalSheet}>
          <View style={s.modalHeader}>
            <TouchableOpacity onPress={() => setShowSpecModal(false)}><Text style={s.modalCancel}>Annuler</Text></TouchableOpacity>
            <Text style={s.modalTitle}>Spécialités</Text>
            <TouchableOpacity onPress={() => setShowSpecModal(false)}><Text style={s.modalConfirm}>OK ({specialties.length})</Text></TouchableOpacity>
          </View>
          <FlatList data={SPECIALTIES} keyExtractor={i => i}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 30 }}
            renderItem={({ item }) => {
              const sel = specialties.includes(item);
              return (
                <TouchableOpacity onPress={() => toggleSpec(item)} style={[s.modalItem, sel && s.modalItemSelected]}>
                  <Text style={[s.modalItemText, sel && { color: '#0d9488', fontWeight: '700' }]}>{item}</Text>
                  {sel && <Text style={{ color: '#0d9488' }}>✓</Text>}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>

      {/* Modal localisation */}
      <Modal visible={showLocModal} transparent animationType="slide" onRequestClose={() => setShowLocModal(false)}>
        <TouchableOpacity style={s.modalBackdrop} activeOpacity={1} onPress={() => setShowLocModal(false)} />
        <View style={s.modalSheet}>
          <View style={s.modalHeader}>
            <TouchableOpacity onPress={() => setShowLocModal(false)}><Text style={s.modalCancel}>Annuler</Text></TouchableOpacity>
            <Text style={s.modalTitle}>📍 Localisation</Text>
            <View style={{ width: 60 }} />
          </View>
          <FlatList data={LOCATIONS} keyExtractor={i => i}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 30 }}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => { setLocation(item); setShowLocModal(false); }}
                style={[s.modalItem, location === item && s.modalItemSelected]}>
                <Text style={[s.modalItemText, location === item && { color: '#0d9488', fontWeight: '700' }]}>{item}</Text>
                {location === item && <Text style={{ color: '#0d9488' }}>✓</Text>}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const s = StyleSheet.create({
  scroll:   { flex: 1, backgroundColor: '#f0fdfa' },
  content:  { paddingHorizontal: 20, paddingTop: 52, paddingBottom: 40 },
  header:   { alignItems: 'center', marginBottom: 28 },
  logoWrap: { width: 60, height: 60, backgroundColor: '#0d9488', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoText: { color: '#fff', fontWeight: '900', fontSize: 22 },
  appName:  { fontSize: 24, fontWeight: '900', color: '#134e4a' },
  appSub:   { color: '#6b7280', marginTop: 4, fontSize: 13 },
  card:     { backgroundColor: '#fff', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 16, elevation: 4, gap: 12 },
  toggle:   { flexDirection: 'row', backgroundColor: '#f3f4f6', borderRadius: 50, padding: 3 },
  toggleBtn:       { flex: 1, paddingVertical: 9, borderRadius: 50, alignItems: 'center' },
  toggleBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  toggleLabel:       { fontWeight: '700', fontSize: 12, color: '#6b7280' },
  toggleLabelActive: { color: '#111827' },
  field:    {},
  label:    { fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 5 },
  input:    { borderWidth: 2, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: '#111827' },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11 },
  inputInner: { flex: 1, fontSize: 14, color: '#111827' },
  inputIcon:  { fontSize: 16, marginRight: 8 },
  phoneRow:   { flexDirection: 'row', borderWidth: 2, borderColor: '#e5e7eb', borderRadius: 12, overflow: 'hidden' },
  phonePrefix:     { backgroundColor: '#f9fafb', paddingHorizontal: 12, paddingVertical: 11, justifyContent: 'center', borderRightWidth: 1, borderRightColor: '#e5e7eb' },
  phonePrefixText: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
  phoneInput:      { flex: 1, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: '#111827' },
  forgotText:  { fontSize: 12, color: '#0d9488', fontWeight: '600' },
  hintError:   { fontSize: 11, color: '#ef4444', marginTop: 3 },
  hintSuccess: { fontSize: 11, color: '#22c55e', marginTop: 3 },
  selectBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 2, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11 },
  selectBtnText: { fontSize: 13, color: '#0d9488', fontWeight: '500' },
  btnPrimary:     { backgroundColor: '#0d9488', borderRadius: 14, paddingVertical: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  btnDisabled:    { opacity: 0.5 },
  btnPrimaryText: { color: '#fff', fontWeight: '900', fontSize: 15 },
  btnOutline:     { borderWidth: 2, borderColor: '#0d9488', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  btnOutlineText: { color: '#0d9488', fontWeight: '900', fontSize: 15 },
  separator: { flexDirection: 'row', alignItems: 'center' },
  sepLine:   { flex: 1, height: 1, backgroundColor: '#e5e7eb' },
  sepText:   { marginHorizontal: 12, fontSize: 12, color: '#9ca3af', fontWeight: '600' },
  switchRow:  { flexDirection: 'row', justifyContent: 'center', paddingVertical: 4 },
  switchText: { color: '#6b7280', fontSize: 13 },
  switchLink: { color: '#0d9488', fontWeight: '700', fontSize: 13 },
  // OTP
  otpIconWrap: { width: 70, height: 70, backgroundColor: '#f0fdfa', borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  otpIcon:     { fontSize: 32 },
  otpTitle:    { fontSize: 20, fontWeight: '900', color: '#134e4a' },
  otpSub:      { fontSize: 12, color: '#6b7280', textAlign: 'center' },
  otpRow:      { flexDirection: 'row', gap: 10 },
  otpBox:      { width: 44, height: 52, borderWidth: 2, borderRadius: 12, borderColor: '#e5e7eb', textAlign: 'center', fontSize: 22, fontWeight: '900', color: '#134e4a', backgroundColor: '#f9fafb' },
  otpBoxFilled:{ borderColor: '#0d9488', backgroundColor: '#f0fdfa' },
  otpError:    { color: '#ef4444', fontSize: 12 },
  otpActions:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  otpBack:     { color: '#9ca3af', fontSize: 12 },
  otpDot:      { color: '#d1d5db' },
  otpResend:   { color: '#0d9488', fontWeight: '700', fontSize: 12 },
  otpTimerText:{ color: '#9ca3af', fontSize: 12 },
  // Modals
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  modalSheet:    { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, position: 'absolute', bottom: 0, left: 0, right: 0, maxHeight: '70%' },
  modalHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  modalCancel:   { color: '#9ca3af', fontSize: 15 },
  modalTitle:    { fontWeight: '800', fontSize: 15, color: '#111827' },
  modalConfirm:  { color: '#0d9488', fontWeight: '800', fontSize: 15 },
  modalItem:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f9fafb' },
  modalItemSelected: { backgroundColor: '#f0fdfa' },
  modalItemText:     { fontSize: 14, color: '#374151' },
});
