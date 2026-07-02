// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { apiUrl, apiClient } from '@/api/client';
import type { TokenResponse, UserResponse } from '@/types/auth';

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

      // 1. Chiamata Axios BASE per il login (Senza interceptor, prende solo i Token)
      const res = await axios.post<TokenResponse>(apiUrl('/login'), body, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      const tokenData = res.data;
      
      // ⚠️ IMPORTANTE: Questo salva i token in localStorage in modo SINCRONO
      persistTokens(tokenData.access_token, tokenData.refresh_token ?? null);

      // 2. Chiamata con IL TUO apiClient per ottenere i dati dell'utente
      // Non c'è più bisogno di apiUrl() né di passare l'Authorization header a mano!
      const userRes = await apiClient.get<UserResponse>('/users/me');
      
      persistUser(userRes.data);

    } catch (e: unknown) { 
      let msg = 'Errore di login';
      
      if (axios.isAxiosError(e)) {
        msg = e.response?.data?.detail || e.message || 'Errore del server';
      } else if (e instanceof Error) {
        msg = e.message;
      }
      
      setError(msg);
      persistTokens(null, null);
      persistUser(null);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    setLoading(true);
    clearError();
    try {
      const normalizedUsername = username.trim().toLowerCase();
      const normalizedEmail = email.trim().toLowerCase();

      await axios.post(apiUrl('/register'), { 
        username: normalizedUsername, 
        email: normalizedEmail, 
        password 
      });

      // Login automatico dopo la registrazione!
      await login(normalizedUsername, password);
    } catch (e: unknown) { // 🪄 TYPE NARROWING PERFETTO ANCHE QUI
      let msg = 'Errore di registrazione';
      
      if (axios.isAxiosError(e)) {
        msg = e.response?.data?.detail || e.message || 'Errore del server';
      } else if (e instanceof Error) {
        msg = e.message;
      }
      
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