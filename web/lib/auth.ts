import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'guinee-sante-secret-change-in-production'
);

export const JWT_COOKIE = 'gs_token';

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'patient' | 'doctor' | 'pharmacist' | 'admin';
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

export async function getAuthUser(req?: Request): Promise<JWTPayload | null> {
  // 1. Bearer token from Authorization header (mobile)
  if (req) {
    const auth = req.headers.get('authorization');
    if (auth?.startsWith('Bearer ')) {
      const token = auth.slice(7);
      return verifyToken(token);
    }
  }
  // 2. Cookie (web browser)
  const cookieStore = await cookies();
  const token = cookieStore.get(JWT_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}
