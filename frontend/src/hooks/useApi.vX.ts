// src/hooks/useApi.ts
import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiUrl } from '../api/client';

export const useApi = () => {
  const { token, logout } = useAuth(); // (Aggiungi logout dal tuo context se vuoi gestire la scadenza del token)

  const request = useCallback(async <T = any>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> => {
    const url = apiUrl(endpoint);
    
    // Configura gli headers in automatico
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    try {
      const response = await fetch(url, { ...options, headers });

      // Se il token è scaduto, disconnetti l'utente (opzionale ma consigliato)
      if (response.status === 401 && logout) {
         logout();
         throw new Error("Sessione scaduta. Effettua di nuovo l'accesso.");
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Errore [${options.method || 'GET'} ${endpoint}]:`, errorText);
        throw new Error(errorText || `Errore HTTP: ${response.status}`);
      }

      // Evita errori di parsing se la risposta è 204 No Content o se è vuota
      if (response.status === 204 || response.status === 304) {
        return {} as T;
      }

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        return (await response.json()) as T;
      }

      return (await response.text()) as any;
      
    } catch (err) {
      console.error(`Eccezione nella chiamata API verso ${endpoint}:`, err);
      throw err; // Rilancia l'errore per farlo gestire al componente visivo
    }
  }, [token, logout]);

  return { request };
};