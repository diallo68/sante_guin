'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Phone, ArrowLeft, ChevronRight } from 'lucide-react';

type Step = 'method' | 'contact' | 'otp' | 'reset' | 'success';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('method');
  const [method, setMethod] = useState<'email' | 'phone' | null>(null);
  const [contact, setContact] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleMethodSelect = (selectedMethod: 'email' | 'phone') => {
    setMethod(selectedMethod);
    setStep('contact');
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!contact.trim()) {
      newErrors.contact = method === 'email' ? 'L\'email est requis' : 'Le numéro est requis';
    } else if (method === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contact)) {
        newErrors.contact = 'Email invalide';
      }
    } else {
      const phoneRegex = /^\+?224\d{8}$/;
      if (!phoneRegex.test(contact.replace(/\s/g, ''))) {
        newErrors.contact = 'Numéro invalide';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setStep('otp');
      setErrors({});
    } catch (error) {
      setErrors({ submit: 'Erreur lors de l\'envoi du code' });
    } finally {
      setLoading(false);
    }
  };

  const handleOTPChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      setErrors({ otp: 'Veuillez entrer les 6 chiffres' });
      return;
    }

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setStep('reset');
      setErrors({});
    } catch (error) {
      setErrors({ otp: 'Code OTP invalide' });
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!newPassword) {
      newErrors.newPassword = 'Le mot de passe est requis';
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'Minimum 8 caractères';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Veuillez confirmer';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setStep('success');
      setErrors({});
    } catch (error) {
      setErrors({ submit: 'Erreur lors de la réinitialisation' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        {step !== 'success' && (
          <button
            onClick={() => {
              if (step === 'method') {
                window.location.href = '/auth/login';
              } else if (step === 'contact') {
                setStep('method');
              } else if (step === 'otp') {
                setStep('contact');
              } else if (step === 'reset') {
                setStep('otp');
              }
            }}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mb-8"
          >
            <ArrowLeft size={20} />
            Retour
          </button>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">GS</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">Guinée Santé</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Récupération de Mot de Passe</h1>
          <p className="text-gray-600">
            {step === 'method' && 'Choisissez votre méthode'}
            {step === 'contact' && 'Entrez votre ' + (method === 'email' ? 'email' : 'numéro')}
            {step === 'otp' && 'Vérifiez votre code'}
            {step === 'reset' && 'Créez un nouveau mot de passe'}
            {step === 'success' && 'Succès !'}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          {/* Step 1: Method Selection */}
          {step === 'method' && (
            <div className="space-y-4">
              <button
                onClick={() => handleMethodSelect('email')}
                className="w-full bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 rounded-lg p-4 text-left transition-all"
              >
                <div className="flex items-center gap-3">
                  <Mail className="w-6 h-6 text-blue-600" />
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">Par Email</h3>
                    <p className="text-sm text-gray-600">Recevez un code par email</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </button>

              <button
                onClick={() => handleMethodSelect('phone')}
                className="w-full bg-green-50 hover:bg-green-100 border-2 border-green-200 rounded-lg p-4 text-left transition-all"
              >
                <div className="flex items-center gap-3">
                  <Phone className="w-6 h-6 text-green-600" />
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">Par SMS</h3>
                    <p className="text-sm text-gray-600">Recevez un code par SMS</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </button>
            </div>
          )}

          {/* Step 2: Contact Input */}
          {step === 'contact' && (
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {method === 'email' ? 'Email' : 'Numéro de Téléphone'}
                </label>
                <input
                  type={method === 'email' ? 'email' : 'tel'}
                  value={contact}
                  onChange={(e) => {
                    setContact(e.target.value);
                    setErrors({});
                  }}
                  placeholder={method === 'email' ? 'votre@email.com' : '+224 XXX XXX XXX'}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all ${
                    errors.contact
                      ? 'border-red-500 focus:border-red-600 bg-red-50'
                      : 'border-gray-300 focus:border-blue-600'
                  }`}
                />
                {errors.contact && (
                  <p className="text-red-600 text-sm mt-1">{errors.contact}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition-all"
              >
                {loading ? 'Envoi en cours...' : 'Envoyer le Code'}
              </button>
            </form>
          )}

          {/* Step 3: OTP Verification */}
          {step === 'otp' && (
            <form onSubmit={handleOTPSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-4">
                  Code de Vérification
                </label>
                <div className="flex gap-3 justify-between">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOTPChange(index, e.target.value)}
                      className={`w-14 h-14 text-center text-2xl font-bold border-2 rounded-lg focus:outline-none transition-all ${
                        errors.otp
                          ? 'border-red-500 focus:border-red-600 bg-red-50'
                          : 'border-gray-300 focus:border-blue-600'
                      }`}
                    />
                  ))}
                </div>
                {errors.otp && (
                  <p className="text-red-600 text-sm mt-2">{errors.otp}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || otp.join('').length !== 6}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition-all"
              >
                {loading ? 'Vérification...' : 'Vérifier'}
              </button>
            </form>
          )}

          {/* Step 4: Reset Password */}
          {step === 'reset' && (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nouveau Mot de Passe
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setErrors({});
                  }}
                  placeholder="••••••••"
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all ${
                    errors.newPassword
                      ? 'border-red-500 focus:border-red-600 bg-red-50'
                      : 'border-gray-300 focus:border-blue-600'
                  }`}
                />
                {errors.newPassword && (
                  <p className="text-red-600 text-sm mt-1">{errors.newPassword}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirmer le Mot de Passe
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setErrors({});
                  }}
                  placeholder="••••••••"
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all ${
                    errors.confirmPassword
                      ? 'border-red-500 focus:border-red-600 bg-red-50'
                      : 'border-gray-300 focus:border-blue-600'
                  }`}
                />
                {errors.confirmPassword && (
                  <p className="text-red-600 text-sm mt-1">{errors.confirmPassword}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition-all"
              >
                {loading ? 'Réinitialisation...' : 'Réinitialiser le Mot de Passe'}
              </button>
            </form>
          )}

          {/* Step 5: Success */}
          {step === 'success' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Mot de Passe Réinitialisé !</h2>
              <p className="text-gray-600 mb-6">
                Votre mot de passe a été réinitialisé avec succès.
              </p>
              <Link
                href="/auth/login"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all block"
              >
                Aller à la Connexion
              </Link>
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== 'success' && (
          <div className="text-center text-sm text-gray-600">
            <p>
              Pas encore de compte ?{' '}
              <Link href="/auth/signup" className="text-blue-600 hover:text-blue-700 font-semibold">
                S'inscrire
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
