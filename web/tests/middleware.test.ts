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
    const res = await middleware(req);
    // NextResponse.next() n'a pas de header Location (pas de redirection).
    expect(res.headers.get('location')).toBeNull();
  });

  it('redirige toujours un patient qui tente d\'accéder à /pro', async () => {
    const token = await signToken({ userId: '507f1f77bcf86cd799439011', email: 'p@test.local', role: 'patient' });
    const req = new NextRequest('http://localhost/pro/dashboard', {
      headers: { cookie: `gs_token=${token}` },
    });
    const res = await middleware(req);
    expect(res.headers.get('location')).toBeTruthy();
  });

  it('laisse un médecin accéder à /pro', async () => {
    const token = await signToken({ userId: '507f1f77bcf86cd799439011', email: 'd@test.local', role: 'doctor' });
    const req = new NextRequest('http://localhost/pro/dashboard', {
      headers: { cookie: `gs_token=${token}` },
    });
    const res = await middleware(req);
    expect(res.headers.get('location')).toBeNull();
  });

  it('redirige vers le login sans cookie de session', async () => {
    const req = new NextRequest('http://localhost/profile');
    const res = await middleware(req);
    expect(res.headers.get('location')).toContain('/auth/login');
  });
});

// Régression RA-08 : le middleware décodait le JWT en base64 sans vérifier
// sa signature — un payload forgé (ex. role: 'doctor') passait la garde de
// page tant que sa structure était valide, avant d'être refusé par l'API.
describe('middleware — vérifie la signature du JWT (RA-08)', () => {
  it('redirige vers le login pour un JWT dont la signature est invalide', async () => {
    const token = await signToken({ userId: '507f1f77bcf86cd799439011', email: 'p@test.local', role: 'patient' });
    const tampered = token.slice(0, -4) + 'AAAA'; // altère la signature sans changer la forme du JWT
    const req = new NextRequest('http://localhost/profile', {
      headers: { cookie: `gs_token=${tampered}` },
    });
    const res = await middleware(req);
    expect(res.headers.get('location')).toContain('/auth/login');
  });

  it("redirige vers le login pour un payload forgé, même bien formé (rôle 'doctor' sans signature valide)", async () => {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const forgedPayload = Buffer.from(JSON.stringify({ userId: '507f1f77bcf86cd799439011', role: 'doctor' })).toString('base64url');
    const forgedToken = `${header}.${forgedPayload}.fakesignature`;
    const req = new NextRequest('http://localhost/pro/dashboard', {
      headers: { cookie: `gs_token=${forgedToken}` },
    });
    const res = await middleware(req);
    expect(res.headers.get('location')).toContain('/auth/login');
  });
});

// Régression RA-07 : script-src autorisait 'unsafe-inline' au lieu d'un
// nonce par requête — voir web/next.config.js et app/layout.tsx pour le
// reste du mécanisme (le nonce posé ici doit se retrouver dans les
// scripts que Next.js injecte lui-même).
describe('middleware — CSP par nonce (RA-07)', () => {
  it('pose un Content-Security-Policy avec un nonce sur une page publique, sans unsafe-inline pour script-src', async () => {
    const req = new NextRequest('http://localhost/doctors');
    const res = await middleware(req);
    const csp = res.headers.get('content-security-policy');
    expect(csp).toBeTruthy();
    // style-src garde 'unsafe-inline' (voir web/middleware.ts) : seul
    // script-src (le vecteur d'exécution) est concerné par le nonce.
    expect(csp?.match(/script-src[^;]*/)?.[0]).not.toContain('unsafe-inline');
    expect(csp).toMatch(/script-src 'self' 'nonce-[^']+' 'strict-dynamic'/);
  });

  it('génère un nonce différent à chaque requête', async () => {
    const csp1 = (await middleware(new NextRequest('http://localhost/doctors'))).headers.get('content-security-policy');
    const csp2 = (await middleware(new NextRequest('http://localhost/doctors'))).headers.get('content-security-policy');
    expect(csp1).not.toBe(csp2);
  });
});
