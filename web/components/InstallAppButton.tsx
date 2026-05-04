'use client';

import { useEffect, useState } from 'react';
import { Download, X, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const PRO_ROLES = ['doctor', 'pharmacist', 'laboratorist'];

export default function InstallAppButton() {
  const [canInstall, setCanInstall] = useState(false);
  const [isPro, setIsPro] = useState<boolean | null>(null); // null = pas encore chargé
  const [showProModal, setShowProModal] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Vérifier si déjà installée
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
      return;
    }

    // Écouter le prompt d'installation
    const handler = (e: Event) => {
      e.preventDefault();
      (window as any).__pwaInstallPrompt = e;
      setCanInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Récupérer le prompt s'il a déjà été capturé par PWAProvider
    if ((window as any).__pwaInstallPrompt) setCanInstall(true);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        setIsPro(data?.user && PRO_ROLES.includes(data.user.role));
      })
      .catch(() => setIsPro(false));
  }, []);

  const handleClick = async () => {
    if (isPro === null) return; // attendre le chargement

    if (!isPro) {
      setShowProModal(true);
      return;
    }

    // Utilisateur Pro → lancer l'installation
    const prompt = (window as any).__pwaInstallPrompt;
    if (prompt) {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === 'accepted') {
        setInstalled(true);
        setCanInstall(false);
      }
    }
  };

  if (installed) return null;

  return (
    <>
      <button
        onClick={handleClick}
        className="inline-flex items-center gap-2 bg-white text-teal-700 font-bold py-3 px-6 rounded-xl hover:bg-teal-50 transition shadow-sm border border-teal-200"
      >
        <Download size={18} />
        Installez l'application
      </button>

      {/* Modal non-Pro */}
      {showProModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowProModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-14 h-14 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Download size={26} className="text-teal-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Option Pro requise</h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              Pour installer l'application Mondocteur sur votre appareil et accéder au mode hors ligne, passez à l'option <strong className="text-teal-600">Mondocteur Pro</strong>.
            </p>
            <div className="space-y-2">
              <Link
                href="/pro-avantages"
                onClick={() => setShowProModal(false)}
                className="flex items-center justify-center gap-2 w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-5 rounded-xl transition"
              >
                Découvrir l'offre Pro <ArrowRight size={16} />
              </Link>
              <button
                onClick={() => setShowProModal(false)}
                className="w-full py-3 px-5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl transition"
              >
                Pas maintenant
              </button>
            </div>
            <button
              onClick={() => setShowProModal(false)}
              className="absolute top-4 right-4 text-gray-300 hover:text-gray-500"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
