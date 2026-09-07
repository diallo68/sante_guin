import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { saveToken, removeToken, saveUser, getSavedUser, getToken } from '@/lib/auth';
import api from '@/lib/api';
import { onUnauthorized } from '@/lib/authEvents';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  // Absent jusqu'ici, comme côté web (voir audit B10) : le champ existe
  // pourtant dans les réponses API et les écrans profil l'utilisaient déjà.
  phone?: string;
  role: 'patient' | 'doctor' | 'pharmacist' | 'laboratorist' | 'admin';
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
    // Restore session on launch. Sans try/finally, une erreur de lecture du
    // stockage local (données corrompues) laissait `loading` bloqué à
    // `true` pour toujours — voir audit B25. La session restaurée est
    // ensuite revalidée auprès du serveur : un token expiré ou révoqué
    // (suspension, changement de mot de passe — voir audit S04) affichait
    // sinon l'utilisateur comme connecté jusqu'au premier appel API échoué.
    (async () => {
      try {
        const saved = await getSavedUser() as User | null;
        const tok = await getToken();
        if (saved && tok) {
          setUser(saved);
          setToken(tok);
          try {
            const res = await api.get('/auth/me');
            const freshUser = res.data.user;
            setUser(freshUser);
            await saveUser(freshUser);
          } catch {
            await removeToken();
            setUser(null);
            setToken(null);
          }
        }
      } catch {
        // Stockage local illisible : démarrer déconnecté plutôt que de
        // rester bloqué indéfiniment.
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    })();

    onUnauthorized(() => {
      removeToken();
      setUser(null);
      setToken(null);
    });
  }, []);

  const login = async (identifier: string, password: string) => {
    const res = await api.post('/auth/login', {
      email: identifier,
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
