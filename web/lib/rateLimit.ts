import { NextRequest } from 'next/server';

// Limitation de fréquence en mémoire, par processus de serveur. Ce n'est
// pas une solution distribuée (un déploiement multi-instance a une limite
// par instance, pas globale) mais ça réduit très nettement le coût nul des
// attaques automatisées (force brute sur mot de passe, épuisement d'OTP,
// spam d'inscription) qui existait auparavant — voir audit S13. Une
// vraie solution (Redis, etc.) reste préférable à grande échelle.
const buckets = new Map<string, { count: number; resetAt: number }>();

// Purge périodique pour éviter une fuite mémoire lente sur un processus
// long-vivant avec beaucoup de clés différentes (IP variées).
let lastSweep = Date.now();
function sweep() {
  const now = Date.now();
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (now > bucket.resetAt) buckets.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  sweep();
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (bucket.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { allowed: true };
}

// Meilleur effort pour identifier le client derrière le reverse proxy Nginx
// devant l'app (voir audit RA-03). Le premier élément de X-Forwarded-For
// est celui que le client a lui-même fourni : rien n'empêche un attaquant
// d'y écrire l'IP de son choix pour se voir attribuer un nouveau quota à
// chaque tentative. Avec un seul proxy de confiance en amont qui utilise
// `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;` (qui
// ajoute $remote_addr à la fin de la valeur reçue plutôt que de l'écraser),
// c'est au contraire le DERNIER élément qui correspond à l'IP TCP vue par
// Nginx, donc non falsifiable par le client. X-Real-IP (`$remote_addr`,
// valeur unique) est préféré quand il est présent, pour la même raison.
//
// ⚠️ Ceci suppose que Nginx est bien configuré ainsi (voir nginx.conf sur
// la VM) ; une IP falsifiable ne suffit de toute façon pas à elle seule
// contre un attaquant déterminé (voir la clé combinée IP+compte utilisée
// par chaque route).
export function clientIp(req: NextRequest): string {
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const parts = forwarded.split(',').map(p => p.trim()).filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  }
  return 'unknown';
}
