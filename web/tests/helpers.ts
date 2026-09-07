import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import User from '@/models/User';
import Doctor from '@/models/Doctor';
import { signToken } from '@/lib/auth';

export type Role = 'patient' | 'doctor' | 'pharmacist' | 'laboratorist' | 'admin';

interface CreateUserOptions {
  role?: Role;
  isVerified?: boolean;
  isSuspended?: boolean;
  email?: string;
  password?: string;
  tokenVersion?: number;
}

let counter = 0;

/** Crée un utilisateur en base et renvoie l'utilisateur + un Bearer token valide. */
export async function createUser(opts: CreateUserOptions = {}) {
  counter += 1;
  const email = opts.email ?? `user${counter}@test.local`;
  const password = opts.password ?? 'password123';
  const passwordHash = await bcrypt.hash(password, 4); // coût réduit : tests plus rapides

  const user = await User.create({
    firstName: 'Test',
    lastName: `User${counter}`,
    email,
    passwordHash,
    role: opts.role ?? 'patient',
    isVerified: opts.isVerified ?? true,
    isSuspended: opts.isSuspended ?? false,
    tokenVersion: opts.tokenVersion ?? 0,
  });

  const token = await signToken({
    userId: user._id.toString(),
    email,
    role: user.role,
    tokenVersion: user.tokenVersion ?? 0,
  });

  return { user, token, email, password };
}

/** Crée un utilisateur médecin + son profil Doctor associé. */
export async function createDoctor(opts: CreateUserOptions = {}) {
  const { user, token } = await createUser({ ...opts, role: 'doctor' });
  const doctor = await Doctor.create({
    userId: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    specialty: 'Médecin généraliste',
    email: user.email,
    city: 'Conakry',
    isAvailable: true,
  });
  return { user, doctor, token };
}

// Pour un corps FormData, le Content-Type (avec son boundary) doit être
// généré par le runtime à la construction de la requête — le fixer
// nous-mêmes casserait le parsing de `formData()` côté handler.
function isFormData(body: unknown): body is FormData {
  return typeof FormData !== 'undefined' && body instanceof FormData;
}

// On ne reprend que `method`/`body` de `init`, pas l'objet en entier : le
// type `RequestInit` du DOM (ex. `signal?: AbortSignal | null`) n'est pas
// strictement compatible avec celui attendu par le constructeur de
// NextRequest, et aucun test ici n'a besoin des autres options fetch.
type SimpleInit = Pick<RequestInit, 'method' | 'body' | 'headers'>;

/** Construit une NextRequest avec un Authorization Bearer, prête pour un handler de route. */
export function authedRequest(url: string, token: string, init: SimpleInit = {}): NextRequest {
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !isFormData(init.body) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  return new NextRequest(url, { method: init.method, body: init.body, headers });
}

export function jsonRequest(url: string, init: SimpleInit = {}): NextRequest {
  const headers = new Headers(init.headers);
  if (init.body && !isFormData(init.body) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  return new NextRequest(url, { method: init.method, body: init.body, headers });
}
