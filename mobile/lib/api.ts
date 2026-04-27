import axios from 'axios';
import { getToken } from '@/lib/auth';

export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach Bearer token on every request (works on both native and web)
api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
