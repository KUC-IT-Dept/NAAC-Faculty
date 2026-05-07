import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../lib/api';

interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'faculty';
  isFirstLogin: boolean;
  isActive: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ faculty?: any }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem('iqac_token');
    const u = localStorage.getItem('iqac_user');
    if (t && u) {
      setToken(t);
      setUser(JSON.parse(u));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { username: email, password });
    localStorage.setItem('iqac_token', data.token);
    localStorage.setItem('iqac_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return { faculty: data.faculty };
  };

  const logout = () => {
    localStorage.removeItem('iqac_token');
    localStorage.removeItem('iqac_user');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const { data } = await api.get('/auth/me');
      localStorage.setItem('iqac_user', JSON.stringify(data.user));
      setUser(data.user);
    } catch { /* silent */ }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
