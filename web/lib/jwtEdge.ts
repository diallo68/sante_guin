import { jwtVerify } from 'jose';

// Vérification cryptographique du JWT réutilisable depuis le runtime Edge
// (web/middleware.ts). Volontairement séparé de lib/auth.ts : celui-ci
// importe next/headers et les modèles Mongoose (@/lib/db, @/models/User),
// qui dépendent d'API Node.js absentes du runtime Edge où tourne le
// middleware — l'importer directement y casserait le build.
//
// Ne fait que vérifier la signature/expiration, pas la revalidation en
// base (suspension, tokenVersion) : cette dernière reste faite par
// resolveSession() dans lib/auth.ts pour chaque route API, seule source de
// vérité pour l'autorisation réelle. Ici, on évite seulement d'afficher la
// coquille d'une page protégée à partir d'un JWT dont la signature ne
// correspond pas — voir audit RA-08.
const rawSecret = process.env.JWT_SECRET;
if (!rawSecret) {
  throw new Error('JWT_SECRET requis (variable d\'environnement manquante)');
}
const JWT_SECRET = new TextEncoder().encode(rawSecret);

export interface EdgeJWTPayload {
  userId: string;
  role: string;
}

export async function verifyTokenEdge(token: string): Promise<EdgeJWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as EdgeJWTPayload;
  } catch {
    return null;
  }
}
