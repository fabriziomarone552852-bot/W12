// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { apiUrl } from '../api/client';
import type { TokenResponse, UserResponse } from '../types/auth';

interface AuthContextValue {
  token: string | null;
  user: UserResponse | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Passaggio a localStorage! Sopravvive a refresh e nuove tab
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  
  const [user, setUser] = useState<UserResponse | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!token;

  const persistTokens = (accessToken: string | null, refToken: string | null) => {
    setToken(accessToken);
    if (accessToken && refToken) {
      localStorage.setItem('token', accessToken);
      localStorage.setItem('refreshToken', refToken);
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    }
  };

  const persistUser = (userData: UserResponse | null) => {
    setUser(userData);
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
    } else {
      localStorage.removeItem('user');
    }
  };

  const clearError = () => setError(null);

  const logout = useCallback(() => {
    persistTokens(null, null);
    persistUser(null);
    clearError();
  }, []);

  // 2. Ascoltiamo il vigile (L'interceptor Axios) se ci dice di sloggare
  useEffect(() => {
    const handleForceLogout = () => {
      console.warn("Sessione completamente scaduta, logout forzato.");
      logout();
    };
    window.addEventListener('force-logout', handleForceLogout);
    return () => window.removeEventListener('force-logout', handleForceLogout);
  }, [logout]);

  const login = async (username: string, password: string) => {
    setLoading(true);
    clearError();
    try {
      const normalizedUsername = username.trim().toLowerCase();
      const body = new URLSearchParams();
      body.append('username', normalizedUsername);
      body.append('password', password);

      const res = await fetch(apiUrl('/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail ?? 'Errore di login');
      }

      const data = await res.json();
      persistTokens(data.access_token, data.refresh_token);
      persistUser({ id: 0, username: normalizedUsername, email: '' } as UserResponse);

    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Errore di login';
      setError(msg);
      persistTokens(null, null);
      persistUser(null);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    // Il register rimane identico a come l'avevi scritto
    setLoading(true);
    clearError();
    try {
      const normalizedUsername = username.trim().toLowerCase();
      const normalizedEmail = email.trim().toLowerCase();

      const res = await fetch(apiUrl('/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: normalizedUsername, email: normalizedEmail, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail ?? 'Errore di registrazione');
      }

      await login(normalizedUsername, password);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Errore di registrazione';
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextValue = {
    token, user, loading, error, isAuthenticated, login, register, logout, clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};