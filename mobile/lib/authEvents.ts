// Petit bus d'événements pour signaler une session expirée/révoquée depuis
// l'intercepteur axios (hors arbre React) jusqu'à AuthContext, qui peut
// alors nettoyer son état immédiatement au lieu d'attendre le prochain
// écran pour le découvrir — voir audit B25.
type Listener = () => void;
let listener: Listener | null = null;

export function onUnauthorized(cb: Listener) {
  listener = cb;
}

export function triggerUnauthorized() {
  listener?.();
}
