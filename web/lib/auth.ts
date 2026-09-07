import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { connectDB } from '@/lib/db';
import User from '@/models/User';

const rawSecret = process.env.JWT_SECRET;
if (!rawSecret) {
  // Aucun secret public de secours : un déploiement mal configuré doit
  // échouer au démarrage plutôt que délivrer des tokens forgeables.
  throw new Error('JWT_SECRET requis (variable d\'environnement manquante)');
}
const JWT_SECRET = new TextEncoder().encode(rawSecret);

export const JWT_COOKIE = 'gs_token';

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'patient' | 'doctor' | 'pharmacist' | 'laboratorist' | 'admin';
  tokenVersion?: number;
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

// Reconfirme en base que le compte porté par le token est toujours valide :
// non supprimé, non suspendu, et tokenVersion à jour. Sans ce contrôle, un
// token émis avant une suspension, une rétrogradation ou un changement de
// mot de passe restait valide jusqu'à son expiration (jusqu'à 7 jours).
async function resolveSession(payload: JWTPayload | null): Promise<JWTPayload | null> {
  if (!payload) return null;
  try {
    await connectDB();
    const account = await User.findById(payload.userId)
      .select('isSuspended tokenVersion role')
      .lean<{ isSuspended?: boolean; tokenVersion?: number; role: JWTPayload['role'] } | null>();
    if (!account || account.isSuspended) return null;
    if ((account.tokenVersion ?? 0) !== (payload.tokenVersion ?? 0)) return null;
    // Le rôle en base fait foi : une rétrogradation prend effet immédiatement.
    return { ...payload, role: account.role };
  } catch {
    return null;
  }
}

export async function getAuthUser(req?: Request): Promise<JWTPayload | null> {
  // 1. Bearer token from Authorization header (mobile)
  if (req) {
    const auth = req.headers.get('authorization');
    if (auth?.startsWith('Bearer ')) {
      const token = auth.slice(7);
      return resolveSession(await verifyToken(token));
    }
  }
  // 2. Cookie (web browser)
  const cookieStore = await cookies();
  const token = cookieStore.get(JWT_COOKIE)?.value;
  if (!token) return null;
  return resolveSession(await verifyToken(token));
}
