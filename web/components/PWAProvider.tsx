'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Download, WifiOff, RefreshCw, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PRO_ROLES = ['doctor', 'pharmacist', 'laboratorist'];

// Snapshot de la session stocké en mémoire pour détecter les changements
function sessionSnapshot(user: any) {
  if (!user) return null;
  return JSON.stringify({ role: user.role, isVerified: user.isVerified, isSuspended: user.isSuspended });
}

export default function PWAProvider() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [showSyncBanner, setShowSyncBanner] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const lastSnapshot = useRef<string | null>(null);
  const router = useRouter();

  // ── Vérification initiale + poll global toutes les 30s ──
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) return;
        const data = await res.json();
        const user = data?.user;

        // Mise à jour isPro pour le banner d'installation
        if (user && PRO_ROLES.includes(user.role)) setIsPro(true);

        const snap = sessionSnapshot(user);

        if (lastSnapshot.current === null) {
          // Premier chargement — on mémorise l'état
          lastSnapshot.current = snap;
        } else if (snap !== lastSnapshot.current) {
          // Changement détecté (rôle, suspension, vérification…) → refresh
          lastSnapshot.current = snap;
          router.refresh();
        }
      } catch {}
    };

    checkSession();
    const interval = setInterval(checkSession, 30000);
    return () => clearInterval(interval);
  }, [router]);

  useEffect(() => {
    // ── Enregistrement du Service Worker ──
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => {
          console.log('[PWA] Service Worker enregistré:', reg.scope);

          // Écouter les messages du SW (file d'attente offline). Écriture
          // directe dans localStorage plutôt que via un state React
          // ré-accumulé à chaque événement : l'ancienne version rejouait
          // tout l'historique de la session à chaque nouvelle entrée,
          // dupliquant la file (3 événements produisaient 6 entrées) —
          // voir audit B05.
          navigator.serviceWorker.addEventListener('message', event => {
            if (event.data?.type === 'QUEUE_REQUEST') {
              try {
                const existing = JSON.parse(localStorage.getItem('mondocteur-sync-queue') || '[]');
                localStorage.setItem('mondocteur-sync-queue', JSON.stringify([...existing, event.data.entry]));
              } catch {}
            }
            if (event.data?.type === 'SYNC_QUEUE') {
              flushQueue();
            }
          });
        })
        .catch(err => console.error('[PWA] Erreur SW:', err));
    }

    // ── Détection connexion / déconnexion ──
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => {
      setIsOffline(false);
      flushQueue();
    };

    setIsOffline(!navigator.onLine);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    // ── Prompt d'installation ──
    const handleInstallPrompt = (e: Event) => {
      e.preventDefault();
      (window as any).__pwaInstallPrompt = e; // accessible par InstallAppButton
      setInstallPrompt(e as BeforeInstallPromptEvent);
      // Banner Pro uniquement
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed && isPro) setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
    };
  }, []);

  // Envoyer les requêtes en attente quand connexion revient
  const flushQueue = async () => {
    const stored = localStorage.getItem('mondocteur-sync-queue');
    if (!stored) return;
    const queue: any[] = JSON.parse(stored);
    if (queue.length === 0) return;

    setShowSyncBanner(true);
    const remaining: any[] = [];

    for (const entry of queue) {
      try {
        const res = await fetch(entry.url, {
          method: entry.method,
          headers: entry.headers,
          body: entry.body || undefined,
        });
        if (!res.ok) remaining.push(entry);
      } catch {
        remaining.push(entry);
      }
    }

    localStorage.setItem('mondocteur-sync-queue', JSON.stringify(remaining));

    setTimeout(() => setShowSyncBanner(false), 3000);
  };

  // Afficher le banner quand isPro est connu et prompt capturé
  useEffect(() => {
    if (isPro && installPrompt) {
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) setShowInstallBanner(true);
    }
  }, [isPro, installPrompt]);

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBanner(false);
      setInstallPrompt(null);
    }
  };

  const dismissInstall = () => {
    setShowInstallBanner(false);
    localStorage.setItem('pwa-install-dismissed', '1');
  };

  return (
    <>
      {/* Banner d'installation */}
      {showInstallBanner && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white border border-teal-200 rounded-2xl shadow-xl p-4 z-50 flex items-start gap-3">
          <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Download size={20} className="text-teal-600" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-gray-900 text-sm">Installer Mondocteur</p>
            <p className="text-xs text-gray-500 mt-0.5">Accédez à l'application directement depuis votre bureau, même hors ligne.</p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleInstall}
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold py-2 px-3 rounded-lg transition"
              >
                Installer
              </button>
              <button
                onClick={dismissInstall}
                className="px-3 py-2 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg transition"
              >
                Plus tard
              </button>
            </div>
          </div>
          <button onClick={dismissInstall} className="text-gray-300 hover:text-gray-500 flex-shrink-0">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Banner hors ligne */}
      {isOffline && (
        <div className="fixed top-16 left-0 right-0 bg-orange-500 text-white text-sm font-semibold px-4 py-2.5 flex items-center justify-center gap-2 z-40 shadow-md">
          <WifiOff size={16} />
          Vous êtes hors ligne — les données seront synchronisées au retour de la connexion
        </div>
      )}

      {/* Banner synchronisation */}
      {showSyncBanner && !isOffline && (
        <div className="fixed top-16 left-0 right-0 bg-teal-600 text-white text-sm font-semibold px-4 py-2.5 flex items-center justify-center gap-2 z-40 shadow-md">
          <RefreshCw size={16} className="animate-spin" />
          Synchronisation des données en cours…
        </div>
      )}
    </>
  );
}
