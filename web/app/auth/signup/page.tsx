'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Phone, User, ChevronRight, X, Check, MapPin } from 'lucide-react';

const LOCATIONS: { group: string; places: string[] }[] = [
  {
    group: 'Conakry — Communes',
    places: ['Kaloum', 'Dixinn', 'Matam', 'Ratoma', 'Matoto'],
  },
  {
    group: 'Basse-Guinée',
    places: ['Coyah', 'Dubréka', 'Forécariah', 'Boffa', 'Fria', 'Kindia', 'Télimélé', 'Kamsar', 'Boké'],
  },
  {
    group: 'Moyenne-Guinée',
    places: ['Labé', 'Mamou', 'Pita', 'Dalaba', 'Mali', 'Koubia', 'Lélouma', 'Tougué'],
  },
  {
    group: 'Haute-Guinée',
    places: ['Kankan', 'Siguiri', 'Kouroussa', 'Mandiana', 'Kérouané', 'Faranah', 'Kissidougou', 'Dinguiraye'],
  },
  {
    group: 'Guinée Forestière',
    places: ['N\'Zérékoré', 'Guéckédou', 'Macenta', 'Yomou', 'Lola', 'Beyla', 'Sipilou'],
  },
];

const SPECIALTIES = [
  'Médecin généraliste',
  'Cardiologue',
  'Chirurgien-dentiste',
  'Dermatologue',
  'Endocrinologue',
  'Gastroentérologue',
  'Gynécologue',
  'Neurologue',
  'Ophtalmologue',
  'ORL',
  'Orthopédiste',
  'Pédiatre',
  'Pneumologue',
  'Psychiatre',
  'Rhumatologue',
  'Chirurgien',
  'Urologue',
  'Urgentiste',
  'Radiologue',
  'Anesthésiste',
  'Médecine interne',
  'Infectiologue',
];

type UserType = 'patient' | 'doctor' | null;
type Step = 'userType' | 'form' | 'verify';

export default function SignupPage() {
  const [step, setStep] = useState<Step>('userType');
  const [userType, setUserType] = useState<UserType>(null);
  const [contactMethod, setContactMethod] = useState<'email' | 'phone'>('email');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSpecialtyModal, setShowSpecialtyModal] = useState(false);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const toggleSpecialty = (specialty: string) => {
    setSelectedSpecialties(prev =>
      prev.includes(specialty)
        ? prev.filter(s => s !== specialty)
        : [...prev, specialty]
    );
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Le prénom est requis';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Le nom est requis';
    }

    if (contactMethod === 'email') {
      if (!formData.email.trim()) {
        newErrors.email = 'L\'email est requis';
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
          newErrors.email = 'Email invalide';
        }
      }
    } else {
      if (!formData.phone.trim()) {
        newErrors.phone = 'Le numéro de téléphone est requis';
      } else {
        const phoneRegex = /^\+?224\d{8}$/;
        if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
          newErrors.phone = 'Numéro de téléphone invalide';
        }
      }
    }

    if (userType === 'doctor' && selectedSpecialties.length === 0) {
      newErrors.specialty = 'Sélectionnez au moins une spécialité';
    }

    if (userType === 'doctor' && !formData.location) {
      newErrors.location = 'La localisation est requise';
    }

    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'La confirmation du mot de passe est requise';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'Vous devez accepter les conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: contactMethod === 'email' ? formData.email : undefined,
          phone: contactMethod === 'phone' ? formData.phone : undefined,
          password: formData.password,
          role: userType === 'doctor' ? 'doctor' : 'patient',
          specialties: userType === 'doctor' ? selectedSpecialties : undefined,
          location: userType === 'doctor' ? formData.location : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors({ submit: data.error || 'Erreur lors de l\'inscription.' });
        return;
      }

      setStep('verify');
    } catch (error) {
      setErrors({ submit: 'Erreur de connexion au serveur. Veuillez réessayer.' });
    } finally {
      setLoading(false);
    }
  };

  if (step === 'userType') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">GS</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">Guinée Santé</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Inscription</h1>
            <p className="text-gray-600">Créez votre compte Guinée Santé</p>
          </div>

          {/* User Type Selection */}
          <div className="space-y-4">
            {/* Patient Card */}
            <button
              onClick={() => {
                setUserType('patient');
                setStep('form');
              }}
              className="w-full bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all border-2 border-transparent hover:border-blue-600"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-blue-600" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-xl font-bold text-gray-900">Patient</h3>
                  <p className="text-gray-600 text-sm">Réservez des rendez-vous et gérez votre santé</p>
                </div>
                <ChevronRight className="w-6 h-6 text-gray-400" />
              </div>
            </button>

            {/* Doctor Card */}
            <button
              onClick={() => {
                setUserType('doctor');
                setStep('form');
              }}
              className="w-full bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all border-2 border-transparent hover:border-orange-600"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-orange-600" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-xl font-bold text-gray-900">Médecin/Cabinet</h3>
                  <p className="text-gray-600 text-sm">Gérez vos patients et rendez-vous</p>
                </div>
                <ChevronRight className="w-6 h-6 text-gray-400" />
              </div>
            </button>
          </div>

          {/* Login Link */}
          <div className="text-center mt-8">
            <p className="text-gray-600">
              Vous avez déjà un compte ?{' '}
              <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-bold">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'verify') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Inscription Réussie !</h2>
            <p className="text-gray-600 mb-6">
              Vérifiez votre {contactMethod === 'email' ? 'email' : 'SMS'} pour confirmer votre compte.
            </p>
            <Link
              href="/auth/login"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all"
            >
              Aller à la Connexion
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">GS</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">Guinée Santé</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Inscription</h1>
          <p className="text-gray-600">
            {userType === 'patient' ? 'Créez votre compte patient' : 'Créez votre compte professionnel'}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Names */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Prénom</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Mohamed"
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all ${
                    errors.firstName
                      ? 'border-red-500 focus:border-red-600 bg-red-50'
                      : 'border-gray-300 focus:border-blue-600'
                  }`}
                />
                {errors.firstName && (
                  <p className="text-red-600 text-sm mt-1">{errors.firstName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nom</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Diallo"
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all ${
                    errors.lastName
                      ? 'border-red-500 focus:border-red-600 bg-red-50'
                      : 'border-gray-300 focus:border-blue-600'
                  }`}
                />
                {errors.lastName && (
                  <p className="text-red-600 text-sm mt-1">{errors.lastName}</p>
                )}
              </div>
            </div>

            {/* Contact Method Tabs */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setContactMethod('email')}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                  contactMethod === 'email'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Mail className="w-5 h-5 mx-auto mb-1" />
                Email
              </button>
              <button
                type="button"
                onClick={() => setContactMethod('phone')}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                  contactMethod === 'phone'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Phone className="w-5 h-5 mx-auto mb-1" />
                Téléphone
              </button>
            </div>

            {/* Email or Phone */}
            {contactMethod === 'email' ? (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="votre@email.com"
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all ${
                    errors.email
                      ? 'border-red-500 focus:border-red-600 bg-red-50'
                      : 'border-gray-300 focus:border-blue-600'
                  }`}
                />
                {errors.email && (
                  <p className="text-red-600 text-sm mt-1">{errors.email}</p>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Numéro de Téléphone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+224 XXX XXX XXX"
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all ${
                    errors.phone
                      ? 'border-red-500 focus:border-red-600 bg-red-50'
                      : 'border-gray-300 focus:border-blue-600'
                  }`}
                />
                {errors.phone && (
                  <p className="text-red-600 text-sm mt-1">{errors.phone}</p>
                )}
              </div>
            )}

            {/* Spécialités (médecin/cabinet) — choix multiple */}
            {userType === 'doctor' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Spécialité(s)
                  </label>
                  {selectedSpecialties.length > 0 && (
                    <span className="text-xs text-blue-600 font-semibold">
                      {selectedSpecialties.length} sélectionnée{selectedSpecialties.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {/* Chips des spécialités sélectionnées */}
                {selectedSpecialties.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedSpecialties.map(s => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full"
                      >
                        {s}
                        <button
                          type="button"
                          onClick={() => toggleSpecialty(s)}
                          className="hover:text-blue-900"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Bouton pour ouvrir le modal */}
                <button
                  type="button"
                  onClick={() => setShowSpecialtyModal(true)}
                  className={`w-full px-4 py-3 border-2 rounded-lg text-left text-sm transition-all ${
                    errors.specialty
                      ? 'border-red-500 bg-red-50 text-red-600'
                      : 'border-gray-300 hover:border-blue-400 text-gray-500'
                  }`}
                >
                  {selectedSpecialties.length === 0
                    ? '+ Ajouter une ou plusieurs spécialités'
                    : '+ Ajouter une autre spécialité'}
                </button>
                {errors.specialty && (
                  <p className="text-red-600 text-sm mt-1">{errors.specialty}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  Un cabinet médical peut exercer plusieurs spécialités.
                </p>

                {/* Modal de sélection */}

                {showSpecialtyModal && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50" onClick={() => setShowSpecialtyModal(false)}>
                    <div className="w-full bg-white rounded-t-3xl p-6 max-h-[70vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-gray-900">Choisissez vos spécialités</h3>
                        <button onClick={() => setShowSpecialtyModal(false)} className="text-gray-400 hover:text-gray-600">
                          <X size={22} />
                        </button>
                      </div>
                      <p className="text-sm text-gray-500 mb-4">Vous pouvez en sélectionner plusieurs.</p>
                      <div className="grid grid-cols-2 gap-2">
                        {SPECIALTIES.map(specialty => {
                          const selected = selectedSpecialties.includes(specialty);
                          return (
                            <button
                              key={specialty}
                              type="button"
                              onClick={() => toggleSpecialty(specialty)}
                              className={`flex items-center justify-between p-3 rounded-xl font-medium text-sm transition-all ${
                                selected
                                  ? 'bg-blue-600 text-white shadow-md'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              <span>{specialty}</span>
                              {selected && <Check size={15} className="flex-shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowSpecialtyModal(false)}
                        className="w-full mt-5 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl"
                      >
                        Confirmer ({selectedSpecialties.length} sélectionnée{selectedSpecialties.length > 1 ? 's' : ''})
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Localisation (médecin/cabinet) */}
            {userType === 'doctor' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <span className="flex items-center gap-1">
                    <MapPin size={15} className="text-gray-500" />
                    Localisation
                  </span>
                </label>
                <select
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all bg-white ${
                    errors.location
                      ? 'border-red-500 focus:border-red-600 bg-red-50'
                      : 'border-gray-300 focus:border-blue-600'
                  }`}
                >
                  <option value="">-- Sélectionnez votre localisation --</option>
                  {LOCATIONS.map(group => (
                    <optgroup key={group.group} label={group.group}>
                      {group.places.map(place => (
                        <option key={place} value={place}>{place}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                {errors.location && (
                  <p className="text-red-600 text-sm mt-1">{errors.location}</p>
                )}
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Mot de Passe</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all ${
                    errors.password
                      ? 'border-red-500 focus:border-red-600 bg-red-50'
                      : 'border-gray-300 focus:border-blue-600'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-600 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Confirmer le Mot de Passe</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all ${
                    errors.confirmPassword
                      ? 'border-red-500 focus:border-red-600 bg-red-50'
                      : 'border-gray-300 focus:border-blue-600'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3.5 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-600 text-sm mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                name="acceptTerms"
                checked={formData.acceptTerms}
                onChange={handleChange}
                className="w-5 h-5 mt-1 accent-blue-600 rounded"
              />
              <label className="text-sm text-gray-600">
                J'accepte les{' '}
                <Link href="/terms" className="text-blue-600 hover:text-blue-700 font-semibold">
                  conditions d'utilisation
                </Link>
                {' '}et la{' '}
                <Link href="/privacy" className="text-blue-600 hover:text-blue-700 font-semibold">
                  politique de confidentialité
                </Link>
              </label>
            </div>
            {errors.acceptTerms && (
              <p className="text-red-600 text-sm">{errors.acceptTerms}</p>
            )}

            {/* Error Message */}
            {errors.submit && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">{errors.submit}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Inscription en cours...
                </>
              ) : (
                'S\'inscrire'
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="text-center mt-6">
            <p className="text-gray-600">
              Vous avez déjà un compte ?{' '}
              <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-bold">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
