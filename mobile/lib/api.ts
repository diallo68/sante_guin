import axios from 'axios';
import { getToken } from '@/lib/auth';
import { triggerUnauthorized } from '@/lib/authEvents';

export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 10000,
  // Signale au serveur qu'il s'agit du client mobile (sans stockage de
  // cookie) : certaines routes d'auth (login, change-password) n'incluent
  // le JWT dans le corps JSON que pour ce client — le web s'appuie
  // uniquement sur le cookie httpOnly (audit RA-02).
  headers: { 'Content-Type': 'application/json', 'X-Client-Platform': 'mobile' },
});

// Attach Bearer token on every request (works on both native and web)
api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Sans ce traitement global, un token expiré ou révoqué (suspension,
// changement de mot de passe — voir audit S04) laissait l'interface
// affichée comme connectée jusqu'à ce qu'un écran interprète lui-même
// l'erreur 401 — voir audit B25.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401) {
      triggerUnauthorized();
    }
    return Promise.reject(error);
  }
);

export default api;
