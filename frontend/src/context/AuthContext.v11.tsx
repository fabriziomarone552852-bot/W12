// src/context/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { apiUrl } from '../api/client';
import type { TokenResponse, UserResponse } from '../types/auth';

interface AuthContextValue {
  token: string | null;
  user: UserResponse | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string
  ) => Promise<void>;
  logout: () => void;
  authHeaders: () => HeadersInit;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('token')
  );

  const [user, setUser] = useState<UserResponse | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!token;

  const persistToken = (value: string | null) => {
    setToken(value);
    if (value) {
      localStorage.setItem('token', value);
    } else {
      localStorage.removeItem('token');
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

  const authHeaders = (): HeadersInit =>
    token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {};

  const login = async (username: string, password: string) => {
    setLoading(true);
    clearError();
    try {
      // NORMALIZZAZIONE USERNAME (Tutto minuscolo e senza spazi extra)
      const normalizedUsername = username.trim().toLowerCase();

      const body = new URLSearchParams();
      body.append('username', normalizedUsername);
      body.append('password', password);

      const res = await fetch(apiUrl('/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail ?? 'Errore di login');
      }

      const data = (await res.json()) as TokenResponse;
      persistToken(data.access_token);

      // Usiamo l'username normalizzato per l'oggetto user
      persistUser({ id: 0, username: normalizedUsername, email: '' } as UserResponse);

    } catch (e: any) {
      const msg = e?.message ?? 'Errore di login';
      setError(msg);
      persistToken(null);
      persistUser(null);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    username: string,
    email: string,
    password: string
  ) => {
    setLoading(true);
    clearError();
    try {
      // NORMALIZZAZIONE USERNAME ED EMAIL
      const normalizedUsername = username.trim().toLowerCase();
      const normalizedEmail = email.trim().toLowerCase();

      const res = await fetch(apiUrl('/register'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username: normalizedUsername, 
          email: normalizedEmail, 
          password 
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail ?? 'Errore di registrazione');
      }

      // Login automatico con i dati normalizzati
      await login(normalizedUsername, password);
    } catch (e: any) {
      const msg = e?.message ?? 'Errore di registrazione';
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(() => {
    persistToken(null);
    persistUser(null);
    clearError();
  }, []);

  useEffect(() => {
    // Placeholder /me
  }, [token, logout]);

  const value: AuthContextValue = {
    token,
    user,
    loading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    authHeaders,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};