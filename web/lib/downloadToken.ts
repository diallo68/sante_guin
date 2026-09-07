// Jetons de téléchargement signés, courts et à usage scopé.
//
// Les documents privés (dossiers patients, pièces jointes) sont servis par
// une route protégée. Le web peut s'appuyer sur le cookie de session, mais
// l'appli mobile ouvre ces liens via `Linking.openURL`, qui n'envoie aucun
// header d'authentification. On embarque donc dans l'URL elle-même un jeton
// signé, valable quelques minutes et lié à un document précis, plutôt que
// de rendre le fichier accessible sans aucun contrôle.
import { SignJWT, jwtVerify } from 'jose';

const rawSecret = process.env.JWT_SECRET;
if (!rawSecret) {
  throw new Error('JWT_SECRET requis (variable d\'environnement manquante)');
}
const SECRET = new TextEncoder().encode(rawSecret);

export interface DownloadTokenPayload {
  docId: string;
  ownerId: string;
  scope: string; // ex: 'pro-document', 'patient-document', 'conversation-attachment'
}

export async function signDownloadToken(payload: DownloadTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(SECRET);
}

export async function verifyDownloadToken(token: string): Promise<DownloadTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as DownloadTokenPayload;
  } catch {
    return null;
  }
}
