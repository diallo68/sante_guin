import { NextRequest } from 'next/server';
import Redis from 'ioredis';
import { logError } from './logger';

// Limitation de fréquence distribuée via Redis — voir audit RA-04. La
// version précédente (une Map en mémoire par processus) ne partageait pas
// les compteurs entre instances : chacune avait sa propre limite, ce qui
// multiplie le budget réel disponible à un attaquant par le nombre
// d'instances. Redis obligatoire en production (échec au démarrage sinon,
// même logique que MONGODB_URI/JWT_SECRET) ; en développement local sans
// Redis installé, on retombe sur l'ancienne limite en mémoire pour ne pas
// bloquer `pnpm dev` — elle protège quand même contre un bourrage trivial
// en solo, juste pas de façon distribuée.
const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL && process.env.NODE_ENV === 'production') {
  throw new Error('REDIS_URL requis en production pour le rate limiting distribué (voir audit RA-04)');
}

// `lazyConnect` : ne tente la connexion qu'au premier appel Redis réel, pas
// à la construction du client — évite des tentatives de connexion bruyantes
// pendant `next build` (qui importe ce module sans jamais l'utiliser).
// `maxRetriesPerRequest: 1` : un rate limit qui échoue doit basculer vite
// sur le repli mémoire plutôt que de faire attendre une requête de login.
const redis = REDIS_URL
  ? new Redis(REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1 })
  : null;

// ── Repli en mémoire (développement local sans Redis, ou Redis en panne) ──
const buckets = new Map<string, { count: number; resetAt: number }>();
let lastSweep = Date.now();
function sweepLocal() {
  const now = Date.now();
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (now > bucket.resetAt) buckets.delete(key);
  }
}
function rateLimitLocal(key: string, limit: number, windowMs: number): RateLimitResult {
  sweepLocal();
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

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
}

export async function rateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  if (!redis) return rateLimitLocal(key, limit, windowMs);

  try {
    // Compteur à fenêtre fixe : INCR puis PEXPIRE seulement sur le premier
    // coup (count === 1) pour ne pas repousser la fenêtre à chaque requête.
    // Léger risque de course sur la toute première requête concurrente
    // d'une fenêtre (compteur créé sans TTL pendant une fraction de
    // seconde) — compromis standard, sans impact réel sur l'objectif
    // (ralentir un bourrage, pas garantir un compte exact au coup près).
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.pexpire(key, windowMs);
    }
    if (count > limit) {
      const ttl = await redis.pttl(key);
      return { allowed: false, retryAfterSeconds: Math.ceil(Math.max(ttl, 0) / 1000) };
    }
    return { allowed: true };
  } catch (error) {
    // Best-effort : une panne Redis temporaire ne doit pas transformer
    // toutes les routes d'auth en 500 — on retombe sur la limite locale
    // plutôt que de bloquer les utilisateurs légitimes.
    logError('Redis rate limit error, repli mémoire locale:', error);
    return rateLimitLocal(key, limit, windowMs);
  }
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
