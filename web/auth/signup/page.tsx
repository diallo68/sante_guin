'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';

type UserType = 'patient' | 'doctor' | '';

const specialties = [
  'Généraliste',
  'Cardiologue',
  'Dermatologue',
  'Neurologue',
  'Chirurgien',
  'Pédiatre',
  'Gynécologue',
  'Ophtalmologue',
  'Orthopédiste',
  'Pneumologue',
  'Gastroentérologue',
  'Urologue',
  'Chirurgien-dentiste',
  'Psychologue',
  'Kinésithérapeute',
  'Pharmacien',
];

export default function SignupPage() {
  const [userType, setUserType] = useState<UserType>('');
  const [showPassword, setShowPassword] = useState(false);
  const [contactMethod, setContactMethod] = useState<'phone' | 'email'>('phone');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    contact: '',
    password: '',
    confirmPassword: '',
    specialty: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Inscription:', { userType, ...formData, contactMethod });
    // Redirection après inscription
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
          <h1 className="text-xl font-bold text-gray-900">Créer un compte</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Type Selection */}
          {!userType ? (
            <div className="space-y-4">
              <p className="text-center text-gray-600 font-medium">Qui êtes-vous ?</p>
              <button
                type="button"
                onClick={() => setUserType('patient')}
                className="w-full bg-white border-2 border-gray-200 p-4 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition text-left"
              >
                <div className="text-2xl mb-2">👤</div>
                <h3 className="font-semibold text-gray-900">Patient</h3>
                <p className="text-sm text-gray-600">Chercher un médecin, prendre rendez-vous</p>
              </button>
              <button
                type="button"
                onClick={() => setUserType('doctor')}
                className="w-full bg-white border-2 border-gray-200 p-4 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition text-left"
              >
                <div className="text-2xl mb-2">👨‍⚕️</div>
                <h3 className="font-semibold text-gray-900">Médecin</h3>
                <p className="text-sm text-gray-600">Gérer vos rendez-vous et patients</p>
              </button>
            </div>
          ) : (
            <>
              {/* Back Button */}
              <button
                type="button"
                onClick={() => setUserType('')}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                ← Changer de type
              </button>

              {/* Name Fields */}
              <div className="space-y-3">
                <input
                  type="text"
                  name="firstName"
                  placeholder="Prénom"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
                <input
                  type="text"
                  name="lastName"
                  placeholder="Nom"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              {/* Specialty for Doctors */}
              {userType === 'doctor' && (
                <select
                  name="specialty"
                  value={formData.specialty}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                >
                  <option value="">Sélectionner une spécialité</option>
                  {specialties.map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              )}

              {/* Contact Method */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Méthode de contact</label>
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

              {/* Confirm Password */}
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirmer le mot de passe"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Créer mon compte
              </button>

              {/* Login Link */}
              <p className="text-center text-gray-600 text-sm">
                Vous avez déjà un compte ?{' '}
                <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
                  Se connecter
                </Link>
              </p>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
