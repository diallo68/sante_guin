import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from '@/middleware';
import { signToken } from '@/lib/auth';

// Régression B02 : `'/profile'.startsWith('/pro')` vaut `true`, donc un
// patient ouvrant son propre profil était redirigé vers l'accueil comme
// s'il tentait d'accéder à l'espace pro.
describe('middleware — /profile n\'est pas confondu avec /pro (B02)', () => {
  it('laisse un patient authentifié accéder à /profile', async () => {
    const token = await signToken({ userId: '507f1f77bcf86cd799439011', email: 'p@test.local', role: 'patient' });
    const req = new NextRequest('http://localhost/profile', {
      headers: { cookie: `gs_token=${token}` },
    });
    const res = middleware(req);
    // NextResponse.next() n'a pas de header Location (pas de redirection).
    expect(res.headers.get('location')).toBeNull();
  });

  it('redirige toujours un patient qui tente d\'accéder à /pro', async () => {
    const token = await signToken({ userId: '507f1f77bcf86cd799439011', email: 'p@test.local', role: 'patient' });
    const req = new NextRequest('http://localhost/pro/dashboard', {
      headers: { cookie: `gs_token=${token}` },
    });
    const res = middleware(req);
    expect(res.headers.get('location')).toBeTruthy();
  });

  it('laisse un médecin accéder à /pro', async () => {
    const token = await signToken({ userId: '507f1f77bcf86cd799439011', email: 'd@test.local', role: 'doctor' });
    const req = new NextRequest('http://localhost/pro/dashboard', {
      headers: { cookie: `gs_token=${token}` },
    });
    const res = middleware(req);
    expect(res.headers.get('location')).toBeNull();
  });

  it('redirige vers le login sans cookie de session', () => {
    const req = new NextRequest('http://localhost/profile');
    const res = middleware(req);
    expect(res.headers.get('location')).toContain('/auth/login');
  });
});
