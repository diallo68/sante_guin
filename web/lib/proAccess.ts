import { NextRequest } from 'next/server';
import { getAuthUser, JWTPayload } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Doctor from '@/models/Doctor';
import Pharmacy from '@/models/Pharmacy';
import Laboratory from '@/models/Laboratory';

export const PRO_ROLES = ['doctor', 'pharmacist', 'laboratorist'] as const;
export type ProRole = (typeof PRO_ROLES)[number];

export type ProAccessResult =
  | { ok: true; authUser: JWTPayload }
  | { ok: false; status: number; error: string };

// Garde commune : authentification + rôle professionnel + abonnement actif.
// Le contrôle de `/api/pro/access` (utilisé pour bloquer les pages /pro/*
// côté UI) n'était pas réutilisé par les routes métier elles-mêmes —
// certaines n'exigeaient qu'une authentification, permettant de contourner
// le paywall en appelant l'API directement. Voir audit S10.
export async function requireActiveSubscription(req: NextRequest): Promise<ProAccessResult> {
  const authUser = await getAuthUser(req);
  if (!authUser) return { ok: false, status: 401, error: 'Non authentifié' };
  if (!PRO_ROLES.includes(authUser.role as ProRole)) {
    return { ok: false, status: 403, error: 'Accès réservé aux professionnels de santé' };
  }

  await connectDB();
  type SubProfile = { subscriptionStatus?: string; subscriptionExpiresAt?: Date } | null;
  let profile: SubProfile = null;
  if (authUser.role === 'doctor') {
    profile = await Doctor.findOne({ userId: authUser.userId }).select('subscriptionStatus subscriptionExpiresAt').lean();
  } else if (authUser.role === 'pharmacist') {
    profile = await Pharmacy.findOne({ userId: authUser.userId }).select('subscriptionStatus subscriptionExpiresAt').lean();
  } else if (authUser.role === 'laboratorist') {
    profile = await Laboratory.findOne({ userId: authUser.userId }).select('subscriptionStatus subscriptionExpiresAt').lean();
  }

  if (!profile) return { ok: false, status: 403, error: 'Profil professionnel introuvable' };

  const isActive = profile.subscriptionStatus === 'active';
  const isExpired = profile.subscriptionExpiresAt ? new Date() > new Date(profile.subscriptionExpiresAt) : false;
  if (!isActive || isExpired) {
    return { ok: false, status: 403, error: 'Abonnement Pro requis ou expiré' };
  }

  return { ok: true, authUser };
}
