import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import Doctor from '@/models/Doctor';
import Pharmacy from '@/models/Pharmacy';
import Laboratory from '@/models/Laboratory';

const PRO_ROLES = ['doctor', 'pharmacist', 'laboratorist'];

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);

    if (!authUser) {
      return NextResponse.json({ isPro: false, reason: 'not_authenticated' }, { status: 401 });
    }

    if (!PRO_ROLES.includes(authUser.role)) {
      return NextResponse.json({ isPro: false, reason: 'wrong_role' }, { status: 403 });
    }

    await connectDB();

    let profile: { subscriptionStatus: string; subscriptionExpiresAt?: Date } | null = null;

    if (authUser.role === 'doctor') {
      profile = await Doctor.findOne({ userId: authUser.userId })
        .select('subscriptionStatus subscriptionExpiresAt');
    } else if (authUser.role === 'pharmacist') {
      profile = await Pharmacy.findOne({ userId: authUser.userId })
        .select('subscriptionStatus subscriptionExpiresAt');
    } else if (authUser.role === 'laboratorist') {
      profile = await Laboratory.findOne({ userId: authUser.userId })
        .select('subscriptionStatus subscriptionExpiresAt');
    }

    if (!profile) {
      return NextResponse.json({ isPro: false, reason: 'no_profile' }, { status: 403 });
    }

    // Vérifier statut + expiration
    const isActive = profile.subscriptionStatus === 'active';
    const isExpired = profile.subscriptionExpiresAt
      ? new Date() > new Date(profile.subscriptionExpiresAt)
      : false;

    if (!isActive || isExpired) {
      return NextResponse.json({
        isPro: false,
        reason: isExpired ? 'expired' : profile.subscriptionStatus,
        subscriptionStatus: profile.subscriptionStatus,
        subscriptionExpiresAt: profile.subscriptionExpiresAt,
      }, { status: 403 });
    }

    return NextResponse.json({
      isPro: true,
      subscriptionStatus: profile.subscriptionStatus,
      subscriptionExpiresAt: profile.subscriptionExpiresAt,
    });
  } catch (error) {
    console.error('Pro access check error:', error);
    return NextResponse.json({ isPro: false, reason: 'server_error' }, { status: 500 });
  }
}
