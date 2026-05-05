'use client';

import { useEffect, useState } from 'react';
import { Download, X, ArrowRight, Monitor, Smartphone } from 'lucide-react';
import Link from 'next/link';

export default function InstallAppButton() {
  const [canInstall, setCanInstall] = useState(false);
  const [isPro, setIsPro] = useState<boolean | null>(null);
  const [showProModal, setShowProModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
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
    // Vérifier via /api/auth/me (admin = accès total) + /api/pro/access (abonnement actif)
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(async data => {
        if (!data?.user) { setIsPro(false); return; }
        // Admin → accès complet
        if (data.user.role === 'admin') { setIsPro(true); return; }
        // Sinon vérifier l'abonnement Pro actif
        const access = await fetch('/api/pro/access').then(r => r.json()).catch(() => null);
        setIsPro(access?.isPro === true);
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
    } else {
      // Le navigateur n'a pas encore déclenché le prompt → instructions manuelles
      setShowManualModal(true);
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

      {/* Modal instructions manuelles */}
      {showManualModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setShowManualModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowManualModal(false)} className="absolute top-4 right-4 text-gray-300 hover:text-gray-500"><X size={18} /></button>
            <div className="w-14 h-14 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Download size={26} className="text-teal-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">Installer Mondocteur</h2>
            <p className="text-gray-500 text-sm text-center mb-5">Suivez les étapes selon votre navigateur :</p>

            <div className="space-y-4">
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="flex items-center gap-2 font-bold text-blue-800 text-sm mb-2"><Monitor size={15} /> Chrome / Edge (PC)</p>
                <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                  <li>Clique sur l'icône <strong>⊕</strong> ou <strong>⋮</strong> en haut à droite</li>
                  <li>Sélectionne <strong>"Installer Mondocteur"</strong></li>
                  <li>Confirme dans la fenêtre qui apparaît</li>
                </ol>
              </div>
              <div className="bg-teal-50 rounded-xl p-4">
                <p className="flex items-center gap-2 font-bold text-teal-800 text-sm mb-2"><Smartphone size={15} /> Safari (iPhone / iPad)</p>
                <ol className="text-xs text-teal-700 space-y-1 list-decimal list-inside">
                  <li>Appuie sur le bouton <strong>Partager</strong> (carré avec flèche)</li>
                  <li>Fais défiler et sélectionne <strong>"Sur l'écran d'accueil"</strong></li>
                  <li>Appuie sur <strong>Ajouter</strong></li>
                </ol>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="flex items-center gap-2 font-bold text-gray-700 text-sm mb-2"><Smartphone size={15} /> Chrome (Android)</p>
                <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
                  <li>Appuie sur <strong>⋮</strong> en haut à droite</li>
                  <li>Sélectionne <strong>"Ajouter à l'écran d'accueil"</strong></li>
                  <li>Confirme en appuyant sur <strong>Ajouter</strong></li>
                </ol>
              </div>
            </div>

            <button onClick={() => setShowManualModal(false)} className="mt-5 w-full py-2.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl transition">
              Fermer
            </button>
          </div>
        </div>
      )}

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
            <h2 className="text-xl font-bold text-gray-900 mb-2">Abonnement Pro requis</h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              Pour accéder à cette fonctionnalité, souscrivez d'abord à l'option <strong className="text-teal-600">Mondocteur Pro</strong>.
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
