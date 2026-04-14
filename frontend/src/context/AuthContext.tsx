import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { AuthUser } from '../services/api';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('cafe_token'));
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem('cafe_user');
    if (!stored) return null;
    try {
      const u = JSON.parse(stored) as Record<string, unknown>;
      if (typeof u.name !== 'string' && typeof u.username === 'string') {
        u.name = u.username as string;
      }
      return u as unknown as AuthUser;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (token) localStorage.setItem('cafe_token', token);
    else localStorage.removeItem('cafe_token');
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem('cafe_user', JSON.stringify(user));
    else localStorage.removeItem('cafe_user');
  }, [user]);

  const login = (newToken: string, newUser: AuthUser) => {
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
