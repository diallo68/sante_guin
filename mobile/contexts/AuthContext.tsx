import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { saveToken, removeToken, saveUser, getSavedUser, getToken } from '@/lib/auth';
import api from '@/lib/api';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  role: 'patient' | 'doctor' | 'pharmacist' | 'admin';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session on launch
    (async () => {
      const saved = await getSavedUser() as User | null;
      const tok = await getToken();
      if (saved && tok) {
        setUser(saved);
        setToken(tok);
      }
      setLoading(false);
    })();
  }, []);

  const login = async (identifier: string, password: string) => {
    const isEmail = identifier.includes('@');
    const res = await api.post('/auth/login', {
      email: isEmail ? identifier : undefined,
      phone: !isEmail ? identifier : undefined,
      password,
    });
    const { token: tok, user: u } = res.data;
    await saveToken(tok);
    await saveUser(u);
    setToken(tok);
    setUser(u);
  };

  const logout = async () => {
    await removeToken();
    setUser(null);
    setToken(null);
  };

  const refresh = async () => {
    try {
      const res = await api.get('/auth/me');
      const u = res.data.user;
      setUser(u);
      await saveUser(u);
    } catch {
      await logout();
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
