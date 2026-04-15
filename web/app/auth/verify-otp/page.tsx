'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Mail, Phone, ArrowLeft } from 'lucide-react';

export default function VerifyOTPPage() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [contactMethod] = useState<'email' | 'phone'>('email');
  const [contact] = useState('user@email.com');

  // Timer pour le renvoi du code
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const handleOTPChange = (index: number, value: string) => {
    if (value.length > 1) return; // Accepter un seul caractère
    if (!/^\d*$/.test(value)) return; // Accepter seulement les chiffres

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus au prochain champ
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }

    setError('');
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Veuillez entrer les 6 chiffres');
      return;
    }

    setLoading(true);
    try {
      // Simulation d'appel API
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Redirection après succès
      window.location.href = '/';
    } catch (err) {
      setError('Code OTP invalide. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    try {
      // Simulation d'appel API
      await new Promise(resolve => setTimeout(resolve, 1500));
      setTimeLeft(60);
      setOtp(['', '', '', '', '', '']);
      setError('');
    } catch (err) {
      setError('Erreur lors du renvoi du code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Link
          href="/auth/login"
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mb-8"
        >
          <ArrowLeft size={20} />
          Retour
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">GS</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">Guinée Santé</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Vérification</h1>
          <p className="text-gray-600">Entrez le code reçu</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          {/* Contact Info */}
          <div className="flex items-center gap-3 bg-blue-50 rounded-lg p-4 mb-6">
            {contactMethod === 'email' ? (
              <Mail className="w-6 h-6 text-blue-600 flex-shrink-0" />
            ) : (
              <Phone className="w-6 h-6 text-blue-600 flex-shrink-0" />
            )}
            <div>
              <p className="text-sm text-gray-600">
                {contactMethod === 'email' ? 'Code envoyé à' : 'Code envoyé au'}
              </p>
              <p className="font-semibold text-gray-900">{contact}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* OTP Inputs */}
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
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className={`w-14 h-14 text-center text-2xl font-bold border-2 rounded-lg focus:outline-none transition-all ${
                      error
                        ? 'border-red-500 focus:border-red-600 bg-red-50'
                        : 'border-gray-300 focus:border-blue-600'
                    }`}
                  />
                ))}
              </div>
              {error && (
                <p className="text-red-600 text-sm mt-2">{error}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || otp.join('').length !== 6}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Vérification...
                </>
              ) : (
                'Vérifier'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-300" />
            <span className="text-gray-500 text-sm">ou</span>
            <div className="flex-1 h-px bg-gray-300" />
          </div>

          {/* Resend Code */}
          <div className="text-center">
            {timeLeft > 0 ? (
              <p className="text-gray-600">
                Renvoyer le code dans{' '}
                <span className="font-bold text-blue-600">{timeLeft}s</span>
              </p>
            ) : (
              <button
                onClick={handleResendCode}
                disabled={loading}
                className="text-blue-600 hover:text-blue-700 font-semibold disabled:text-gray-400"
              >
                Renvoyer le code
              </button>
            )}
          </div>

          {/* Help Text */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Conseil :</span> Vérifiez votre dossier spam ou courrier indésirable si vous ne recevez pas le code.
            </p>
          </div>
        </div>

        {/* Footer Links */}
        <div className="text-center text-sm text-gray-600">
          <p>
            Besoin d'aide ?{' '}
            <Link href="/contact" className="text-blue-600 hover:text-blue-700 font-semibold">
              Contactez-nous
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
