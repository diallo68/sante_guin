import { NextRequest, NextResponse } from 'next/server';
import { JWT_COOKIE, getAuthUser } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';

export async function POST(req: NextRequest) {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(JWT_COOKIE);

  // Incrémente tokenVersion pour révoquer réellement le JWT courant : sans
  // ça, un token copié avant la déconnexion restait valable jusqu'à son
  // expiration (jusqu'à 7 jours) — voir audit RA-01. Best-effort : un échec
  // ici ne doit pas empêcher la déconnexion côté client.
  try {
    const authUser = await getAuthUser(req);
    if (authUser) {
      await connectDB();
      await User.findByIdAndUpdate(authUser.userId, { $inc: { tokenVersion: 1 } });
    }
  } catch (error) {
    console.error('Logout tokenVersion increment error:', error);
  }

  return response;
}
