'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function DeleteAccountPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/account/delete-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });
      setStatus(res.ok ? 'success' : 'error');
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-red-600 to-rose-700 text-white py-16 px-4">
        <div className="max-w-xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-red-100 hover:text-white text-sm mb-8 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour à l&apos;accueil
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div>
              <p className="text-red-200 text-sm font-semibold uppercase tracking-wider">Compte &amp; Données</p>
              <h1 className="text-3xl font-black">Supprimer mon compte</h1>
            </div>
          </div>
          <p className="text-red-100 text-sm">Votre demande sera traitée dans un délai de 30 jours.</p>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

          {status === 'success' ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Demande envoyée</h2>
              <p className="text-gray-600 text-sm">
                Votre demande de suppression a bien été reçue. Nous la traiterons dans un délai de 30 jours
                et vous enverrons une confirmation à <strong>{email}</strong>.
              </p>
            </div>
          ) : (
            <>
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-8">
                <h3 className="font-bold text-red-800 mb-2">Ce qui sera supprimé :</h3>
                <ul className="text-red-700 text-sm space-y-1 list-disc list-inside">
                  <li>Votre compte et informations personnelles</li>
                  <li>Votre historique de rendez-vous</li>
                  <li>Vos messages</li>
                  <li>Vos données de santé</li>
                </ul>
                <p className="text-red-600 text-xs mt-3 font-medium">Cette action est irréversible.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Nom complet</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Votre nom"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Adresse email du compte</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="email@exemple.com"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                  />
                </div>

                {status === 'error' && (
                  <p className="text-red-600 text-sm">Une erreur est survenue. Réessayez ou contactez-nous à <a href="mailto:privacy@mondocteur.org" className="underline">privacy@mondocteur.org</a>.</p>
                )}

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
                >
                  {status === 'loading' ? 'Envoi en cours…' : 'Envoyer la demande de suppression'}
                </button>
              </form>
            </>
          )}
        </div>

        <div className="flex items-center justify-center gap-6 mt-8 text-sm text-gray-500">
          <Link href="/" className="hover:text-teal-600 transition-colors">Accueil</Link>
          <span>·</span>
          <Link href="/privacy" className="hover:text-teal-600 transition-colors">Politique de confidentialité</Link>
          <span>·</span>
          <a href="mailto:privacy@mondocteur.org" className="hover:text-teal-600 transition-colors">Contact</a>
        </div>
      </div>
    </div>
  );
}
