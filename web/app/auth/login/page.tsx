'use client';

export const dynamic = 'force-dynamic';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, X, Check, MapPin } from 'lucide-react';

// ────────────────────────────────────────────────────────────
// Données statiques
// ────────────────────────────────────────────────────────────
const LOCATIONS: { group: string; places: string[] }[] = [
  { group: 'Conakry — Communes', places: ['Kaloum', 'Dixinn', 'Matam', 'Ratoma', 'Matoto'] },
  { group: 'Basse-Guinée', places: ['Coyah', 'Dubréka', 'Forécariah', 'Boffa', 'Fria', 'Kindia', 'Télimélé', 'Kamsar', 'Boké'] },
  { group: 'Moyenne-Guinée', places: ['Labé', 'Mamou', 'Pita', 'Dalaba', 'Mali', 'Koubia', 'Lélouma', 'Tougué'] },
  { group: 'Haute-Guinée', places: ['Kankan', 'Siguiri', 'Kouroussa', 'Mandiana', 'Kérouané', 'Faranah', 'Kissidougou', 'Dinguiraye'] },
  { group: 'Guinée Forestière', places: ['N\'Zérékoré', 'Guéckédou', 'Macenta', 'Yomou', 'Lola', 'Beyla', 'Sipilou'] },
];

const SPECIALTIES = [
  'Médecin généraliste', 'Cardiologue', 'Chirurgien-dentiste', 'Dermatologue',
  'Endocrinologue', 'Gastroentérologue', 'Gynécologue', 'Neurologue', 'Ophtalmologue',
  'ORL', 'Orthopédiste', 'Pédiatre', 'Pneumologue', 'Psychiatre', 'Rhumatologue',
  'Chirurgien', 'Urologue', 'Urgentiste', 'Radiologue', 'Anesthésiste',
  'Médecine interne', 'Infectiologue',
];

const OAUTH_ERRORS: Record<string, string> = {
  oauth_misconfigured: 'Connexion Google non disponible pour le moment.',
  oauth_cancelled: 'Connexion Google annulée.',
  oauth_token_failed: 'Erreur lors de la connexion Google. Réessayez.',
  oauth_profile_failed: 'Impossible de récupérer votre profil Google.',
  oauth_no_email: "Votre compte Google n'a pas d'email associé.",
  oauth_server_error: 'Erreur serveur. Réessayez.',
  account_suspended: 'Ce compte a été suspendu. Contactez le support.',
  oauth_invalid_state: 'Session de connexion expirée. Veuillez réessayer.',
};

type Tab      = 'login' | 'register';
type UserType = 'patient' | 'doctor';
type RegStep   = 'form' | 'otp';

// ────────────────────────────────────────────────────────────
// Page principale
// ────────────────────────────────────────────────────────────
export default function AuthPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>(() =>
    searchParams.get('tab') === 'register' ? 'register' : 'login'
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-lg">GS</span>
            </div>
            <span className="text-2xl font-black text-gray-900">Guinée Santé</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Onglets */}
          <div className="flex border-b border-gray-100">
            {(['login', 'register'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-3.5 text-sm font-bold transition-colors border-b-2 ${
                  tab === t
                    ? 'border-teal-600 text-teal-600'
                    : 'border-transparent text-gray-400 hover:text-gray-700'
                }`}
              >
                {t === 'login' ? 'Se connecter' : "S'inscrire"}
              </button>
            ))}
          </div>

          {/* Corps */}
          <div className="p-6">
            {tab === 'login'
              ? <LoginForm onSwitchTab={() => setTab('register')} />
              : <RegisterForm onSwitchTab={() => setTab('login')} />
            }
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-gray-400">
          <div className="flex gap-4 justify-center">
            <Link href="/terms" className="hover:text-gray-600">Conditions</Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-gray-600">Confidentialité</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Formulaire Connexion
// ────────────────────────────────────────────────────────────
function LoginForm({ onSwitchTab }: { onSwitchTab: () => void }) {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ contact: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const searchParams = useSearchParams();

  useEffect(() => {
    const oauthError = searchParams.get('error');
    if (oauthError && OAUTH_ERRORS[oauthError]) setErrors({ submit: OAUTH_ERRORS[oauthError] });
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.contact.trim()) {
      e.contact = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact)) {
      e.contact = 'Email invalide';
    }
    if (!formData.password) e.password = 'Le mot de passe est requis';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact: formData.contact, password: formData.password }),
      });
      const data = await res.json();
      if (!res.ok) { setErrors({ submit: data.error || 'Erreur lors de la connexion.' }); return; }
      const role = data.user?.role;
      window.location.href = (role === 'doctor' || role === 'pharmacist') ? '/pro/dashboard' : '/';
    } catch {
      setErrors({ submit: 'Erreur de connexion au serveur.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
          <input
            type="email"
            name="contact" value={formData.contact} onChange={handleChange}
            placeholder="votre@email.com"
            className={`w-full px-3 py-2.5 border-2 rounded-xl text-sm focus:outline-none transition-all ${errors.contact ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-teal-500'}`}
          />
          {errors.contact && <p className="text-red-500 text-xs mt-1">{errors.contact}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Mot de passe</label>
          <div className={`flex items-center border-2 rounded-xl overflow-hidden transition-all ${errors.password ? 'border-red-400' : 'border-gray-200 focus-within:border-teal-500'}`}>
            <input
              type={showPassword ? 'text' : 'password'} name="password"
              value={formData.password} onChange={handleChange} placeholder="••••••••"
              className="flex-1 px-3 py-2.5 text-sm outline-none"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="px-3 text-gray-400">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
        </div>

        <div className="text-right">
          <Link href="/auth/forgot-password" className="text-teal-600 text-xs font-semibold hover:underline">
            Mot de passe oublié ?
          </Link>
        </div>

        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-red-600 text-sm">{errors.submit}</p>
          </div>
        )}

        <button type="submit" disabled={loading}
          className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-black py-3 rounded-xl transition-all flex items-center justify-center gap-2">
          {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Connexion...</> : 'Se connecter'}
        </button>
      </form>

      <div className="flex items-center gap-3 my-2">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-gray-400 text-xs">ou</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <a href="/api/auth/google"
        className="w-full border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-semibold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm">
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Continuer avec Google
      </a>

      <p className="text-center text-sm text-gray-500">
        Pas encore de compte ?{' '}
        <button onClick={onSwitchTab} className="text-teal-600 font-bold hover:underline">S'inscrire</button>
      </p>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Formulaire Inscription
// ────────────────────────────────────────────────────────────
function RegisterForm({ onSwitchTab }: { onSwitchTab: () => void }) {
  const [regStep, setRegStep] = useState<RegStep>('form');
  const [userType, setUserType] = useState<UserType>('patient');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword]   = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [showSpecialtyModal, setShowSpecialtyModal] = useState(false);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '',
    location: '', password: '', confirmPassword: '', acceptTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // OTP
  const [userId, setUserId]               = useState('');
  const [verifyContact, setVerifyContact] = useState('');
  const [otp, setOtp]                     = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError]           = useState('');
  const [resendTimer, setResendTimer]     = useState(0);
  const otpRefs = [
    useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null),
  ];

  const pwMatch = formData.password && formData.confirmPassword
    ? formData.password === formData.confirmPassword : null;

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const toggleSpecialty = (s: string) =>
    setSelectedSpecialties(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.firstName.trim()) e.firstName = 'Le prénom est requis';
    if (!formData.lastName.trim())  e.lastName  = 'Le nom est requis';
    if (!formData.email.trim()) e.email = 'L\'email est requis';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = 'Email invalide';
    if (userType === 'doctor' && selectedSpecialties.length === 0) e.specialty = 'Sélectionnez au moins une spécialité';
    if (userType === 'doctor' && !formData.location) e.location = 'La localisation est requise';
    if (!formData.password) e.password = 'Le mot de passe est requis';
    else if (formData.password.length < 8) e.password = 'Minimum 8 caractères';
    if (formData.password !== formData.confirmPassword) e.confirmPassword = 'Les mots de passe ne correspondent pas';
    if (!formData.acceptTerms) e.acceptTerms = 'Vous devez accepter les conditions';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName, lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          role: userType === 'doctor' ? 'doctor' : 'patient',
          specialties: userType === 'doctor' ? selectedSpecialties : undefined,
          location: userType === 'doctor' ? formData.location : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setErrors({ submit: data.error || 'Erreur lors de l\'inscription.' }); return; }
      setUserId(data.userId);
      setVerifyContact(data.contact);
      setResendTimer(60);
      setRegStep('otp');
    } catch {
      setErrors({ submit: 'Erreur de connexion au serveur.' });
    } finally {
      setLoading(false);
    }
  };

  const handleOTPChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setOtpError('');
    if (value && index < 5) otpRefs[index + 1].current?.focus();
  };

  const handleOTPKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) otpRefs[index - 1].current?.focus();
  };

  const handleVerifyOTP = async () => {
    const code = otp.join('');
    if (code.length !== 6) { setOtpError('Veuillez entrer les 6 chiffres'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, otp: code }),
      });
      const data = await res.json();
      if (!res.ok) { setOtpError(data.error || 'Code incorrect'); return; }
      window.location.href = '/';
    } catch {
      setOtpError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    try {
      await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      setResendTimer(60);
      setOtp(['', '', '', '', '', '']);
      setOtpError('');
    } catch {
      setOtpError('Erreur lors du renvoi du code');
    } finally {
      setLoading(false);
    }
  };

  // ── Step OTP ──
  if (regStep === 'otp') {
    return (
      <div className="space-y-5">
        <div className="text-center">
          <div className="text-4xl mb-2">📧</div>
          <p className="font-black text-gray-900">Code de vérification</p>
          <p className="text-xs text-gray-500 mt-1">
            Envoyé à{' '}
            <span className="font-semibold text-gray-700">{verifyContact}</span>
          </p>
        </div>

        <div className="flex justify-center gap-2">
          {otp.map((digit, i) => (
            <input
              key={i} ref={otpRefs[i]}
              type="text" inputMode="numeric" maxLength={1} value={digit}
              onChange={e => handleOTPChange(i, e.target.value)}
              onKeyDown={e => handleOTPKeyDown(i, e)}
              className={`w-11 h-12 text-center text-xl font-black border-2 rounded-xl focus:outline-none transition-all
                ${digit ? 'border-teal-500 bg-teal-50' : otpError ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-teal-500'}`}
            />
          ))}
        </div>
        {otpError && <p className="text-red-500 text-xs text-center">{otpError}</p>}

        <button onClick={handleVerifyOTP} disabled={loading || otp.join('').length !== 6}
          className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-black py-3 rounded-xl transition-all flex items-center justify-center gap-2">
          {loading
            ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Vérification...</>
            : '✅ Valider et créer mon compte'}
        </button>

        <div className="flex justify-center items-center gap-3 text-xs">
          <button onClick={() => { setRegStep('form'); setOtp(['', '', '', '', '', '']); setOtpError(''); }}
            className="text-gray-400 hover:text-gray-600">← Modifier mes infos</button>
          <span className="text-gray-300">·</span>
          {resendTimer > 0
            ? <span className="text-gray-400">Renvoyer dans <span className="text-teal-600 font-bold">{resendTimer}s</span></span>
            : <button onClick={handleResendOTP} disabled={loading} className="text-teal-600 font-bold hover:underline">Renvoyer le code</button>
          }
        </div>
      </div>
    );
  }

  // ── Step Formulaire ──
  return (
    <div className="space-y-4">
      {/* Toggle Patient / Médecin */}
      <div className="flex bg-gray-100 rounded-full p-1">
        {([
          { key: 'patient', label: '🧑 Patient' },
          { key: 'doctor',  label: '👨‍⚕️ Médecin / Cabinet' },
        ] as const).map(t => (
          <button key={t.key} type="button" onClick={() => setUserType(t.key)}
            className={`flex-1 py-2 rounded-full text-xs font-bold transition-all ${userType === t.key ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSendCode} className="space-y-3">
        {/* Prénom + Nom */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Prénom *</label>
            <input type="text" name="firstName" value={formData.firstName} onChange={handleChange}
              placeholder="Mohamed"
              className={`w-full px-3 py-2.5 border-2 rounded-xl text-sm focus:outline-none transition-all ${errors.firstName ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-teal-500'}`} />
            {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Nom</label>
            <input type="text" name="lastName" value={formData.lastName} onChange={handleChange}
              placeholder="Diallo"
              className={`w-full px-3 py-2.5 border-2 rounded-xl text-sm focus:outline-none transition-all ${errors.lastName ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-teal-500'}`} />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">📧 Email *</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange}
            placeholder="votre@email.com"
            className={`w-full px-3 py-2.5 border-2 rounded-xl text-sm focus:outline-none transition-all ${errors.email ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-teal-500'}`} />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>

        {/* Spécialités (médecin) */}
        {userType === 'doctor' && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-gray-700">Spécialité(s) *</label>
              {selectedSpecialties.length > 0 && (
                <span className="text-xs text-teal-600 font-semibold">{selectedSpecialties.length} sélectionnée{selectedSpecialties.length > 1 ? 's' : ''}</span>
              )}
            </div>
            {selectedSpecialties.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {selectedSpecialties.map(s => (
                  <span key={s} className="inline-flex items-center gap-1 bg-teal-100 text-teal-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                    {s}
                    <button type="button" onClick={() => toggleSpecialty(s)}><X size={10} /></button>
                  </span>
                ))}
              </div>
            )}
            <button type="button" onClick={() => setShowSpecialtyModal(true)}
              className={`w-full px-3 py-2 border-2 rounded-xl text-left text-xs transition-all ${errors.specialty ? 'border-red-400 bg-red-50 text-red-500' : 'border-gray-200 hover:border-teal-400 text-gray-400'}`}>
              {selectedSpecialties.length === 0 ? '+ Ajouter une spécialité' : '+ Ajouter une autre'}
            </button>
            {errors.specialty && <p className="text-red-500 text-xs mt-1">{errors.specialty}</p>}

            {showSpecialtyModal && (
              <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={() => setShowSpecialtyModal(false)}>
                <div className="w-full bg-white rounded-t-3xl p-5 max-h-[65vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-black text-gray-900">Spécialités</h3>
                    <button onClick={() => setShowSpecialtyModal(false)} className="text-gray-400"><X size={18} /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {SPECIALTIES.map(s => {
                      const sel = selectedSpecialties.includes(s);
                      return (
                        <button key={s} type="button" onClick={() => toggleSpecialty(s)}
                          className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-medium transition-all ${sel ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                          <span>{s}</span>
                          {sel && <Check size={12} />}
                        </button>
                      );
                    })}
                  </div>
                  <button type="button" onClick={() => setShowSpecialtyModal(false)}
                    className="w-full mt-4 bg-teal-600 text-white font-black py-2.5 rounded-xl text-sm">
                    Confirmer ({selectedSpecialties.length})
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Localisation (médecin) */}
        {userType === 'doctor' && (
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              <span className="flex items-center gap-1"><MapPin size={11} /> Localisation *</span>
            </label>
            <select name="location" value={formData.location} onChange={handleChange}
              className={`w-full px-3 py-2.5 border-2 rounded-xl text-xs focus:outline-none bg-white transition-all ${errors.location ? 'border-red-400' : 'border-gray-200 focus:border-teal-500'}`}>
              <option value="">-- Sélectionnez votre localisation --</option>
              {LOCATIONS.map(g => (
                <optgroup key={g.group} label={g.group}>
                  {g.places.map(p => <option key={p} value={p}>{p}</option>)}
                </optgroup>
              ))}
            </select>
            {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
          </div>
        )}

        {/* Mot de passe */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">🔒 Mot de passe * <span className="text-gray-400 font-normal">(8 min)</span></label>
          <div className={`flex items-center border-2 rounded-xl overflow-hidden transition-all ${errors.password ? 'border-red-400' : 'border-gray-200 focus-within:border-teal-500'}`}>
            <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange}
              placeholder="••••••••" className="flex-1 px-3 py-2.5 text-sm outline-none" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="px-3 text-gray-400">
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
        </div>

        {/* Confirmer */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">🔒 Confirmer *</label>
          <div className={`flex items-center border-2 rounded-xl overflow-hidden transition-all ${pwMatch === false ? 'border-red-400' : pwMatch === true ? 'border-green-400' : 'border-gray-200 focus-within:border-teal-500'}`}>
            <input type={showPassword2 ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
              placeholder="Répétez le mot de passe" className="flex-1 px-3 py-2.5 text-sm outline-none" />
            <button type="button" onClick={() => setShowPassword2(!showPassword2)} className="px-3 text-gray-400">
              {showPassword2 ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {pwMatch === false && <p className="text-red-500 text-xs mt-1">❌ Les mots de passe ne correspondent pas</p>}
          {pwMatch === true  && <p className="text-green-600 text-xs mt-1">✅ Les mots de passe correspondent</p>}
        </div>

        {/* Conditions */}
        <div className="flex items-start gap-2">
          <input type="checkbox" name="acceptTerms" checked={formData.acceptTerms} onChange={handleChange}
            className="w-3.5 h-3.5 mt-0.5 accent-teal-600 shrink-0" />
          <label className="text-xs text-gray-500">
            J'accepte les{' '}
            <Link href="/terms" className="text-teal-600 font-semibold hover:underline">conditions</Link>
            {' '}et la{' '}
            <Link href="/privacy" className="text-teal-600 font-semibold hover:underline">confidentialité</Link>
          </label>
        </div>
        {errors.acceptTerms && <p className="text-red-500 text-xs">{errors.acceptTerms}</p>}

        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-red-600 text-sm">{errors.submit}</p>
          </div>
        )}

        <button type="submit" disabled={loading}
          className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-black py-3 rounded-xl transition-all flex items-center justify-center gap-2">
          {loading
            ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Envoi...</>
            : '📧 Recevoir le code de vérification →'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500">
        Déjà un compte ?{' '}
        <button onClick={onSwitchTab} className="text-teal-600 font-bold hover:underline">Se connecter</button>
      </p>
    </div>
  );
}
