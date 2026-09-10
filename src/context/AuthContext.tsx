/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../lib/api';

interface AuthUser {
  id: string;
  username: string;
  email: string;
  // 'superadmin' and 'iqac_director' are both coerced to 'admin' below (see
  // coerceRole) - they share the same institutional-bypass access on the
  // backend (auth/constants/roles.js ROLE_GROUPS.ADMIN_ONLY), and reusing
  // the existing 'admin' UI is the existing pattern already established
  // here for 'superadmin', not a new one invented for this phase.
  // 'staff' is new: a staff account has no role-based bypass, only
  // whatever modulePermissions it's been granted (e.g. ["library"]).
  role: 'admin' | 'faculty' | 'vc' | 'hod' | 'staff';
  isFirstLogin: boolean;
  isActive: boolean;
  // Present for 'staff' users (and harmless/absent for others). Mirrors
  // auth/models/User.model.js's modulePermissions field exactly - this is
  // the existing backend permission model, not a new frontend one.
  modulePermissions?: string[];
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

// Coerces the backend's raw role into the frontend's existing role set.
// 'superadmin' -> 'admin' already existed before this phase. 'iqac_director'
// -> 'admin' is added here for the same reason: both are exactly
// ROLE_GROUPS.ADMIN_ONLY on the backend (see auth/constants/roles.js), the
// two roles that bypass module permissions entirely for Library/MMTTC (and
// any other institutional module). Any other role (including 'staff') is
// passed through unchanged.
function coerceRole(rawUser: any) {
  if (rawUser && (rawUser.role === 'superadmin' || rawUser.role === 'iqac_director')) {
    rawUser.role = 'admin';
  }
  return rawUser;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem('iqac_token');
    const u = localStorage.getItem('iqac_user');
    if (t && u) {
      setToken(t);
      const parsedUser = coerceRole(JSON.parse(u));
      setUser(parsedUser);
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { username: email, password });
    localStorage.setItem('iqac_token', data.token);
    setToken(data.token);

    // The login response's user object is a hand-picked subset (see
    // modules/faculty/routes/auth.js) that does not include
    // modulePermissions. /auth/me returns the full, live database
    // document instead (it's already used elsewhere via refreshUser()),
    // so fetch it once right after login to get the complete, current
    // user - this is the existing enrichment endpoint, not a new one.
    let finalUser = coerceRole(data.user);
    try {
      const meRes = await api.get('/auth/me');
      finalUser = coerceRole(meRes.data.user);
    } catch {
      // If /auth/me fails for some reason, fall back to the login
      // response's user object rather than blocking login entirely -
      // modulePermissions will simply be treated as absent (no institutional
      // module access shown), which is the safe default.
    }

    localStorage.setItem('iqac_user', JSON.stringify(finalUser));
    if (data.faculty) localStorage.setItem('iqac_faculty', JSON.stringify(data.faculty));
    setUser(finalUser);
    return { faculty: data.faculty };
  };

  const logout = () => {
    // Clear user-specific profile draft from localStorage
    if (user?.id) {
      localStorage.removeItem(`naac_profile_${user.id}`);
    }
    localStorage.removeItem('iqac_token');
    localStorage.removeItem('iqac_user');
    localStorage.removeItem('iqac_faculty');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const { data } = await api.get('/auth/me');
      const finalUser = coerceRole(data.user);
      localStorage.setItem('iqac_user', JSON.stringify(finalUser));
      if (data.faculty) localStorage.setItem('iqac_faculty', JSON.stringify(data.faculty));
      setUser(finalUser);
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
