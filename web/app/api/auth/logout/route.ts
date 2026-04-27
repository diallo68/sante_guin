import { NextResponse } from 'next/server';
import { JWT_COOKIE } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(JWT_COOKIE);
  return response;
}
