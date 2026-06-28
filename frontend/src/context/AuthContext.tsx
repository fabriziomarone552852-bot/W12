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
  // USIAMO sessionStorage: i token si cancellano appena chiudi la pagina
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem('token'));
  const [refreshToken, setRefreshToken] = useState<string | null>(() => sessionStorage.getItem('refreshToken'));

  const [user, setUser] = useState<UserResponse | null>(() => {
    const savedUser = sessionStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!token;

  const persistTokens = (accessToken: string | null, refToken: string | null) => {
    setToken(accessToken);
    setRefreshToken(refToken);
    
    if (accessToken && refToken) {
      sessionStorage.setItem('token', accessToken);
      sessionStorage.setItem('refreshToken', refToken);
    } else {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('refreshToken');
    }
  };

  const persistUser = (userData: UserResponse | null) => {
    setUser(userData);
    if (userData) {
      sessionStorage.setItem('user', JSON.stringify(userData));
    } else {
      sessionStorage.removeItem('user');
    }
  };

  const clearError = () => setError(null);

  const authHeaders = (): HeadersInit =>
    token ? { Authorization: `Bearer ${token}` } : {};

  const rinnovaPassaporto = useCallback(async () => {
    if (!refreshToken) return false;

    try {
      // 1. Indirizzo "pulito", senza il token attaccato alla fine
      const url = apiUrl('/refresh'); 
      
      const res = await fetch(url, { 
        method: 'POST',
        // 2. Diciamo allo sportellista che stiamo consegnando un pacchetto di dati standard (JSON)
        headers: {
          'Content-Type': 'application/json'
        },
        // 3. Mettiamo il token DENTRO la busta (il body)
        body: JSON.stringify({ refresh_token: refreshToken }) 
      });

      if (res.ok) {
        const data = await res.json();
        persistTokens(data.access_token, refreshToken);
        return true;
      } else {
        logout();
        return false;
      }
    } catch (err) {
      console.error("Errore durante il rinnovo del passaporto:", err);
      return false;
    }
  }, [refreshToken]);

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
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
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
      // Controlliamo in modo sicuro se 'e' è un errore standard
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
    setLoading(true);
    clearError();
    try {
      const normalizedUsername = username.trim().toLowerCase();
      const normalizedEmail = email.trim().toLowerCase();

      const res = await fetch(apiUrl('/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

      await login(normalizedUsername, password);
    } catch (e: unknown) {
      // Controlliamo in modo sicuro se 'e' è un errore standard
      const msg = e instanceof Error ? e.message : 'Errore di registrazione';
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(() => {
    persistTokens(null, null);
    persistUser(null);
    clearError();
  }, []);

  useEffect(() => {
    if (refreshToken) {
      rinnovaPassaporto();
    }

    const intervalId = setInterval(() => {
      if (refreshToken) {
        rinnovaPassaporto();
      }
    }, 2700000);

    return () => clearInterval(intervalId);
  }, [refreshToken, rinnovaPassaporto]);

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