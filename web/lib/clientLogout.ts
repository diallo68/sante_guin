'use client';

const QUEUE_KEY = 'mondocteur-sync-queue';

// Déconnexion complète : révoque le cookie serveur, puis purge le cache du
// Service Worker et la file de synchronisation hors-ligne. Sans ça, sur un
// appareil partagé, la personne suivante pouvait retrouver les réponses API
// mises en cache (dossiers, conversations…) et les requêtes en attente
// (potentiellement un mot de passe en clair) du compte précédent — voir
// audit S08/S09.
export async function logout(): Promise<void> {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch {
    // On purge quand même le cache local même si l'appel serveur échoue.
  }

  try {
    localStorage.removeItem(QUEUE_KEY);
  } catch {}

  try {
    if (typeof window !== 'undefined' && 'caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(key => caches.delete(key)));
    }
  } catch {}
}
