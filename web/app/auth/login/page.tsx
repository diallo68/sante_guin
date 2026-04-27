'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Phone } from 'lucide-react';

const OAUTH_ERRORS: Record<string, string> = {
  oauth_misconfigured: 'Connexion Google non disponible pour le moment.',
  oauth_cancelled: 'Connexion Google annulée.',
  oauth_token_failed: 'Erreur lors de la connexion Google. Réessayez.',
  oauth_profile_failed: 'Impossible de récupérer votre profil Google.',
  oauth_no_email: "Votre compte Google n'a pas d'email associé.",
  oauth_server_error: 'Erreur serveur. Réessayez.',
};

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    contact: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const oauthError = searchParams.get('error');
    if (oauthError && OAUTH_ERRORS[oauthError]) {
      setErrors({ submit: OAUTH_ERRORS[oauthError] });
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.contact.trim()) {
      newErrors.contact = loginMethod === 'email' 
        ? 'L\'email est requis' 
        : 'Le numéro de téléphone est requis';
    } else if (loginMethod === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.contact)) {
        newErrors.contact = 'Email invalide';
      }
    } else {
      const phoneRegex = /^\+?224\d{8}$/;
      if (!phoneRegex.test(formData.contact.replace(/\s/g, ''))) {
        newErrors.contact = 'Numéro de téléphone invalide';
      }
    }

    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact: formData.contact, password: formData.password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors({ submit: data.error || 'Erreur lors de la connexion.' });
        return;
      }

      // Redirection selon le rôle
      const role = data.user?.role;
      if (role === 'doctor' || role === 'pharmacist') {
        window.location.href = '/pro/dashboard';
      } else {
        window.location.href = '/';
      }
    } catch (error) {
      setErrors({ submit: 'Erreur de connexion au serveur. Veuillez réessayer.' });
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Connexion</h1>
          <p className="text-gray-600">Accédez à votre compte Guinée Santé</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          {/* Login Method Tabs */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setLoginMethod('email')}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                loginMethod === 'email'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Mail className="w-5 h-5 mx-auto mb-1" />
              Email
            </button>
            <button
              onClick={() => setLoginMethod('phone')}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                loginMethod === 'phone'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Phone className="w-5 h-5 mx-auto mb-1" />
              Téléphone
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Contact Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {loginMethod === 'email' ? 'Email' : 'Numéro de Téléphone'}
              </label>
              <input
                type={loginMethod === 'email' ? 'email' : 'tel'}
                name="contact"
                value={formData.contact}
                onChange={handleChange}
                placeholder={loginMethod === 'email' ? 'votre@email.com' : '+224 XXX XXX XXX'}
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

            {/* Password Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Mot de Passe
              </label>
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

            {/* Forgot Password Link */}
            <div className="text-right">
              <Link
                href="/auth/forgot-password"
                className="text-blue-600 hover:text-blue-700 text-sm font-semibold"
              >
                Mot de passe oublié ?
              </Link>
            </div>

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
                  Connexion en cours...
                </>
              ) : (
                'Se Connecter'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-300" />
            <span className="text-gray-500 text-sm">ou</span>
            <div className="flex-1 h-px bg-gray-300" />
          </div>

          {/* Social Login */}
          <div className="space-y-3">
            <a
              href="/api/auth/google"
              className="w-full border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continuer avec Google
            </a>
          </div>
        </div>

        {/* Sign Up Link */}
        <div className="text-center">
          <p className="text-gray-600">
            Pas encore de compte ?{' '}
            <Link href="/auth/signup" className="text-blue-600 hover:text-blue-700 font-bold">
              S'inscrire
            </Link>
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>En vous connectant, vous acceptez nos</p>
          <div className="flex gap-4 justify-center mt-2">
            <Link href="/terms" className="hover:text-gray-700">Conditions</Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-gray-700">Confidentialité</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
