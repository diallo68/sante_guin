'use client';

export const dynamic = 'force-dynamic';

import { useState, useRef, useEffect, useMemo } from 'react';
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
type UserType = 'patient' | 'doctor' | 'pharmacist' | 'laboratorist';
type RegStep   = 'form' | 'otp';

const ROLES: { key: UserType; label: string; emoji: string }[] = [
  { key: 'patient',      label: 'Patient',       emoji: '🧑' },
  { key: 'doctor',       label: 'Médecin',       emoji: '👨‍⚕️' },
  { key: 'pharmacist',   label: 'Pharmacien',    emoji: '💊' },
  { key: 'laboratorist', label: 'Laboratoriste', emoji: '🔬' },
];

// Une question du parcours conversationnel (façon Typeform : une question à
// la fois plutôt qu'un long formulaire) — même mécanisme que sur
// YouGouYouGou (packages/frontend RegisterForm.tsx), adapté aux 4 rôles et
// aux champs attendus par /api/auth/signup, avec le thème visuel Mondocteur.
type QuestionId = 'role' | 'nameCombo' | 'dob' | 'city' | 'specialties' | 'orgName' | 'location' | 'email' | 'password' | 'password2' | 'terms';
interface Question { id: QuestionId }

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
  const [qIndex, setQIndex] = useState(0);
  const [role, setRole] = useState<UserType>('patient');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword]   = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [showSpecialtyModal, setShowSpecialtyModal] = useState(false);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  // Une seule case « Prénom et Nom » à l'écran (comme YouGouYouGou) ; séparée
  // en interne puisque le backend attend les deux champs.
  const [fullName, setFullName] = useState('');
  const handleFullNameChange = (v: string) => {
    setFullName(v);
    const parts = v.trim().split(/\s+/);
    setFirstName(parts[0] || '');
    setLastName(parts.slice(1).join(' '));
  };

  const [dob, setDob]                     = useState('');
  const [city, setCity]                   = useState(''); // ville de résidence
  const [email, setEmail]                 = useState('');
  const [password, setPassword]           = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [location, setLocation]           = useState(''); // localisation professionnelle (médecin/pharmacien/laboratoriste)
  const [orgName, setOrgName]             = useState(''); // nom pharmacie/laboratoire
  const [acceptTerms, setAcceptTerms]     = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const answerRef = useRef<HTMLInputElement & HTMLSelectElement>(null);

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

  const pwMatch = password && confirmPassword ? password === confirmPassword : null;

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const toggleSpecialty = (s: string) =>
    setSelectedSpecialties(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  // Le parcours dépend du rôle choisi à la première question — mécanisme
  // identique à YouGouYouGou (une question à la fois), adapté aux 4 rôles.
  const questions: Question[] = useMemo(() => {
    const q: Question[] = [{ id: 'role' }, { id: 'nameCombo' }, { id: 'dob' }, { id: 'city' }];
    if (role === 'doctor') q.push({ id: 'specialties' }, { id: 'location' });
    if (role === 'pharmacist' || role === 'laboratorist') q.push({ id: 'orgName' }, { id: 'location' });
    q.push({ id: 'email' }, { id: 'password' }, { id: 'password2' }, { id: 'terms' });
    return q;
  }, [role]);

  // Pas de minimum d'âge (contrairement à YouGouYouGou) : un mineur doit
  // pouvoir créer son propre compte patient pour prendre rendez-vous —
  // l'app n'a pas de notion de compte accompagnant/enfant. Seule contrainte :
  // pas de date dans le futur.
  const maxDob = new Date().toISOString().split('T')[0];

  const q = questions[Math.min(qIndex, questions.length - 1)];
  const progress = Math.round(((qIndex + 1) / questions.length) * 100);

  // Remet le focus sur le champ texte à chaque nouvelle question
  useEffect(() => {
    const t = setTimeout(() => answerRef.current?.focus(), 200);
    return () => clearTimeout(t);
  }, [qIndex]);

  const orgNameLabel = role === 'pharmacist' ? 'Nom de la pharmacie ?' : 'Nom du laboratoire ?';

  // Valide la question courante ; renvoie un message d'erreur ou null
  const validateCurrent = (): string | null => {
    switch (q.id) {
      case 'nameCombo':   return firstName.trim() ? null : 'Le prénom est obligatoire';
      case 'dob':         return dob ? null : 'Date de naissance requise';
      case 'city':        return city ? null : 'Choisissez votre ville de résidence';
      case 'specialties': return selectedSpecialties.length > 0 ? null : 'Sélectionnez au moins une spécialité';
      case 'orgName':     return orgName.trim() ? null : 'Ce champ est requis';
      case 'location':    return location ? null : 'Choisissez votre localisation';
      case 'email':
        if (!email.trim()) return 'Entrez votre adresse email';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Email invalide';
        return null;
      case 'password':  return password.length >= 8 ? null : 'Mot de passe trop court (8 min)';
      case 'password2': return password === confirmPassword ? null : 'Les mots de passe ne correspondent pas';
      case 'terms':     return acceptTerms ? null : 'Vous devez accepter les conditions';
      default:          return null; // 'role' géré à part (choix par carte)
    }
  };

  const validate = () => {
    // Revalide tout le parcours (au cas où une question aurait été
    // modifiée après coup via "← Retour") avant l'envoi final.
    for (const question of questions) {
      const err = (() => {
        switch (question.id) {
          case 'nameCombo':   return firstName.trim() ? null : 'err';
          case 'dob':         return dob ? null : 'err';
          case 'city':        return city ? null : 'err';
          case 'specialties': return selectedSpecialties.length > 0 ? null : 'err';
          case 'orgName':     return orgName.trim() ? null : 'err';
          case 'location':    return location ? null : 'err';
          case 'email':       return email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? null : 'err';
          case 'password':    return password.length >= 8 ? null : 'err';
          case 'password2':   return password === confirmPassword ? null : 'err';
          case 'terms':       return acceptTerms ? null : 'err';
          default:            return null;
        }
      })();
      if (err) return false;
    }
    return true;
  };

  const handleSendCode = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName, lastName, email, password, role, dob, city,
          specialties: role === 'doctor' ? selectedSpecialties : undefined,
          location: (role === 'doctor' || role === 'pharmacist' || role === 'laboratorist') ? location : undefined,
          pharmacyName: role === 'pharmacist' ? orgName : undefined,
          laboratoryName: role === 'laboratorist' ? orgName : undefined,
          acceptTerms,
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

  const goNext = () => {
    const err = validateCurrent();
    if (err) { setErrors({ [q.id]: err }); return; }
    setErrors({});
    if (qIndex < questions.length - 1) setQIndex(i => i + 1);
    else handleSendCode();
  };

  const goBack = () => { setErrors({}); if (qIndex > 0) setQIndex(i => i - 1); };
  const handleEnter = (e: React.KeyboardEvent) => { if (e.key === 'Enter') goNext(); };

  // Choix par carte (rôle) : avance automatiquement après sélection.
  // `advancing` évite un double-clic pendant le délai d'animation.
  const advancing = useRef(false);
  const pickRole = (r: UserType) => {
    if (advancing.current) return;
    advancing.current = true;
    setRole(r);
    setErrors({});
    setTimeout(() => { advancing.current = false; setQIndex(i => i + 1); }, 200);
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

  // ── Step Formulaire : une question à la fois ──────────────────────────
  return (
    <div key={qIndex} className="flex flex-col gap-5 min-h-[380px]">
      {/* Barre de progression */}
      <div className="flex flex-col gap-2">
        <div className="h-1 rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full bg-teal-600 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-[11px] font-bold text-gray-400">Question {qIndex + 1} sur {questions.length}</span>
      </div>

      {/* Corps de la question, centré verticalement */}
      <div className="flex-1 flex flex-col justify-center gap-4">
        {q.id === 'role' && (
          <>
            <p className="text-sm font-bold text-teal-700">👋 Bienvenue sur Mondocteur</p>
            <h3 className="text-xl font-black text-gray-900 -mt-1">Vous êtes ?</h3>
            <div className="grid grid-cols-2 gap-3 mt-1">
              {ROLES.map(r => (
                <button key={r.key} type="button" onClick={() => pickRole(r.key)}
                  className={`flex flex-col items-center gap-2 py-5 rounded-2xl border-2 transition-colors ${role === r.key ? 'border-teal-600 bg-teal-50' : 'border-gray-200 hover:border-teal-300'}`}>
                  <span className="text-2xl">{r.emoji}</span>
                  <span className="text-sm font-bold text-gray-900">{r.label}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {q.id === 'nameCombo' && (
          <div className="flex flex-col gap-2">
            <h3 className="text-xl font-black text-gray-900">Quel est votre prénom et nom ?</h3>
            <input ref={answerRef} type="text" value={fullName} onChange={e => handleFullNameChange(e.target.value)}
              onKeyDown={handleEnter} placeholder="Mohamed Diallo" autoComplete="name"
              className="text-xl font-semibold text-gray-900 bg-transparent outline-none border-b-2 border-gray-200 focus:border-teal-600 pb-2 placeholder:text-gray-300 placeholder:font-medium" />
            {errors.nameCombo && <p className="text-red-500 text-xs font-semibold">⚠️ {errors.nameCombo}</p>}
          </div>
        )}

        {q.id === 'dob' && (
          <div className="flex flex-col gap-2">
            <h3 className="text-xl font-black text-gray-900">🎂 Votre date de naissance ?</h3>
            <input ref={answerRef} type="date" value={dob} onChange={e => setDob(e.target.value)}
              onKeyDown={handleEnter} max={maxDob} autoComplete="bday"
              className="text-xl font-semibold text-gray-900 bg-transparent outline-none border-b-2 border-gray-200 focus:border-teal-600 pb-2" />
            {errors.dob && <p className="text-red-500 text-xs font-semibold">⚠️ {errors.dob}</p>}
          </div>
        )}

        {q.id === 'city' && (
          <div className="flex flex-col gap-2">
            <h3 className="text-xl font-black text-gray-900 flex items-center gap-1.5"><MapPin size={18} className="text-teal-600" /> Votre ville de résidence ?</h3>
            <select ref={answerRef} value={city} onChange={e => setCity(e.target.value)}
              className="text-xl font-semibold text-gray-900 bg-transparent outline-none border-b-2 border-gray-200 focus:border-teal-600 pb-2 appearance-none cursor-pointer">
              <option value="">Choisir votre ville...</option>
              {LOCATIONS.map(g => (
                <optgroup key={g.group} label={g.group}>
                  {g.places.map(p => <option key={p} value={p}>{p}</option>)}
                </optgroup>
              ))}
            </select>
            {errors.city && <p className="text-red-500 text-xs font-semibold">⚠️ {errors.city}</p>}
          </div>
        )}

        {q.id === 'specialties' && (
          <div className="flex flex-col gap-2">
            <h3 className="text-xl font-black text-gray-900">Votre/vos spécialité(s) ?</h3>
            {selectedSpecialties.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-1">
                {selectedSpecialties.map(s => (
                  <span key={s} className="inline-flex items-center gap-1 bg-teal-100 text-teal-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                    {s}
                    <button type="button" onClick={() => toggleSpecialty(s)}><X size={10} /></button>
                  </span>
                ))}
              </div>
            )}
            <button type="button" onClick={() => setShowSpecialtyModal(true)}
              className="w-full px-3 py-2.5 border-2 border-dashed rounded-xl text-left text-sm border-gray-300 hover:border-teal-400 text-gray-500 transition-all">
              {selectedSpecialties.length === 0 ? '+ Ajouter une spécialité' : '+ Ajouter une autre'}
            </button>
            {errors.specialties && <p className="text-red-500 text-xs font-semibold">⚠️ {errors.specialties}</p>}

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

        {q.id === 'orgName' && (
          <div className="flex flex-col gap-2">
            <h3 className="text-xl font-black text-gray-900">{orgNameLabel}</h3>
            <input ref={answerRef} type="text" value={orgName} onChange={e => setOrgName(e.target.value)}
              onKeyDown={handleEnter} placeholder={role === 'pharmacist' ? 'Pharmacie Centrale' : 'Labo BioSanté'}
              className="text-xl font-semibold text-gray-900 bg-transparent outline-none border-b-2 border-gray-200 focus:border-teal-600 pb-2 placeholder:text-gray-300 placeholder:font-medium" />
            {errors.orgName && <p className="text-red-500 text-xs font-semibold">⚠️ {errors.orgName}</p>}
          </div>
        )}

        {q.id === 'location' && (
          <div className="flex flex-col gap-2">
            <h3 className="text-xl font-black text-gray-900 flex items-center gap-1.5"><MapPin size={18} className="text-teal-600" /> Localisation ?</h3>
            <select ref={answerRef} value={location} onChange={e => setLocation(e.target.value)}
              className="text-xl font-semibold text-gray-900 bg-transparent outline-none border-b-2 border-gray-200 focus:border-teal-600 pb-2 appearance-none cursor-pointer">
              <option value="">Choisir votre localisation...</option>
              {LOCATIONS.map(g => (
                <optgroup key={g.group} label={g.group}>
                  {g.places.map(p => <option key={p} value={p}>{p}</option>)}
                </optgroup>
              ))}
            </select>
            {errors.location && <p className="text-red-500 text-xs font-semibold">⚠️ {errors.location}</p>}
          </div>
        )}

        {q.id === 'email' && (
          <div className="flex flex-col gap-2">
            <h3 className="text-xl font-black text-gray-900">📧 Votre adresse email ?</h3>
            <input ref={answerRef} type="email" value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={handleEnter} placeholder="votre@email.com" autoComplete="email"
              className="text-xl font-semibold text-gray-900 bg-transparent outline-none border-b-2 border-gray-200 focus:border-teal-600 pb-2 placeholder:text-gray-300 placeholder:font-medium" />
            {errors.email && <p className="text-red-500 text-xs font-semibold">⚠️ {errors.email}</p>}
          </div>
        )}

        {q.id === 'password' && (
          <div className="flex flex-col gap-2">
            <h3 className="text-xl font-black text-gray-900">🔒 Créez un mot de passe</h3>
            <p className="text-xs text-gray-400 font-semibold -mt-2">8 caractères min.</p>
            <div className="flex items-end gap-2 border-b-2 border-gray-200 focus-within:border-teal-600 pb-2">
              <input ref={answerRef} type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={handleEnter} placeholder="••••••••" autoComplete="new-password"
                className="flex-1 min-w-0 text-xl font-semibold text-gray-900 bg-transparent outline-none placeholder:text-gray-300 placeholder:font-medium" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 shrink-0">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs font-semibold">⚠️ {errors.password}</p>}
          </div>
        )}

        {q.id === 'password2' && (
          <div className="flex flex-col gap-2">
            <h3 className="text-xl font-black text-gray-900">🔒 Confirmez le mot de passe</h3>
            <div className="flex items-end gap-2 border-b-2 border-gray-200 focus-within:border-teal-600 pb-2">
              <input ref={answerRef} type={showPassword2 ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                onKeyDown={handleEnter} placeholder="Répétez le mot de passe" autoComplete="new-password"
                className="flex-1 min-w-0 text-xl font-semibold text-gray-900 bg-transparent outline-none placeholder:text-gray-300 placeholder:font-medium" />
              <button type="button" onClick={() => setShowPassword2(!showPassword2)} className="text-gray-400 shrink-0">
                {showPassword2 ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {pwMatch === false && <p className="text-red-500 text-xs font-semibold">❌ Les mots de passe ne correspondent pas</p>}
            {pwMatch === true  && <p className="text-green-600 text-xs font-semibold">✅ Les mots de passe correspondent</p>}
          </div>
        )}

        {q.id === 'terms' && (
          <div className="flex flex-col gap-3">
            <h3 className="text-xl font-black text-gray-900">Dernière étape</h3>
            <label className="flex items-start gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={acceptTerms} onChange={e => setAcceptTerms(e.target.checked)}
                className="w-4 h-4 mt-0.5 accent-teal-600 shrink-0" />
              <span>
                J'accepte les{' '}
                <Link href="/terms" className="text-teal-600 font-semibold hover:underline">conditions</Link>
                {' '}et la{' '}
                <Link href="/privacy" className="text-teal-600 font-semibold hover:underline">confidentialité</Link>
              </span>
            </label>
            {errors.terms && <p className="text-red-500 text-xs font-semibold">⚠️ {errors.terms}</p>}
          </div>
        )}

        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-red-600 text-sm">{errors.submit}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      {q.id !== 'role' && (
        <div className="flex items-center justify-between">
          <button onClick={goBack} className="text-sm font-bold text-gray-400 hover:text-gray-700">← Retour</button>
          <button onClick={goNext} disabled={loading}
            className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-black py-2.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2">
            {loading
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Envoi...</>
              : qIndex === questions.length - 1 ? '📧 Recevoir le code de vérification →' : 'Suivant →'}
          </button>
        </div>
      )}
      {q.id === 'role' && (
        <p className="text-center text-sm text-gray-500">
          Déjà un compte ?{' '}
          <button onClick={onSwitchTab} className="text-teal-600 font-bold hover:underline">Se connecter</button>
        </p>
      )}
    </div>
  );
}
