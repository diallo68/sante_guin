'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [contactMethod, setContactMethod] = useState<'phone' | 'email'>('phone');
  const [formData, setFormData] = useState({
    contact: '',
    password: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Connexion:', { ...formData, contactMethod });
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Connexion</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-2">🏥</div>
            <h2 className="text-2xl font-bold text-gray-900">Guinée Santé</h2>
          </div>

          {/* Contact Method */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Méthode de connexion</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setContactMethod('phone')}
                className={`flex-1 py-2 px-3 rounded-lg font-medium transition ${
                  contactMethod === 'phone'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📱 Téléphone
              </button>
              <button
                type="button"
                onClick={() => setContactMethod('email')}
                className={`flex-1 py-2 px-3 rounded-lg font-medium transition ${
                  contactMethod === 'email'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ✉️ Email
              </button>
            </div>
          </div>

          {/* Contact Input */}
          <input
            type={contactMethod === 'phone' ? 'tel' : 'email'}
            name="contact"
            placeholder={contactMethod === 'phone' ? '+224 XXX XX XX XX' : 'votre@email.com'}
            value={formData.contact}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            required
          />

          {/* Password */}
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Mot de passe"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-gray-600"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Forgot Password */}
          <Link href="/auth/forgot-password" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            Mot de passe oublié ?
          </Link>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Se connecter
          </button>

          {/* Signup Link */}
          <p className="text-center text-gray-600 text-sm">
            Pas encore de compte ?{' '}
            <Link href="/auth/signup" className="text-blue-600 hover:text-blue-700 font-medium">
              S'inscrire
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
