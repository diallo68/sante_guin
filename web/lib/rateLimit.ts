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

// Meilleur effort pour identifier le client derrière un reverse proxy
// (Render, etc.). Une IP falsifiable ne suffit pas à elle seule contre un
// attaquant déterminé (voir la clé combinée utilisée par chaque route),
// mais reste la seule information disponible sans session.
export function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}
