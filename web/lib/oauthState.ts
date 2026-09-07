// Nom du cookie httpOnly portant le `state` OAuth Google entre le départ
// du flux et le callback — voir audit S15. Isolé ici plutôt que dans
// route.ts : Next.js n'autorise pas les exports arbitraires depuis un
// fichier de route (seuls GET/POST/... et quelques noms réservés le sont).
export const OAUTH_STATE_COOKIE = 'gs_oauth_state';
