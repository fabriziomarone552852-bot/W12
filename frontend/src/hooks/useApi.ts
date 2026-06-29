// src/hooks/useApi.ts
import { useCallback } from 'react';
import { apiUrl } from '../api/client';
import { useAuth } from '../context/AuthContext';

export const useApi = () => {
  const { authHeaders } = useAuth();

  const request = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    // 1. Usiamo la classe nativa Headers per normalizzare qualsiasi formato di options.headers
    const headers = new Headers(options.headers);

    // 2. Aggiungiamo gli header di autenticazione
    const currentAuthHeaders = authHeaders();
    Object.entries(currentAuthHeaders).forEach(([key, value]) => {
      headers.set(key, value as string);
    });

    // 3. Se stiamo inviando un body (POST/PATCH), aggiungiamo automaticamente il Content-Type
    if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    // 4. Eseguiamo la fetch
    const response = await fetch(apiUrl(endpoint), {
      ...options,
      headers, // Passiamo la nostra istanza sicura di Headers
    });

    // 5. Gestione Errori Centralizzata
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Errore API: ${response.status}`);
    }

    // 6. Gestione risposte vuote (es. DELETE 204 No Content)
    if (response.status === 204) {
      return null;
    }

    // 7. Restituiamo l'oggetto JSON
    return response.json();
  }, [authHeaders]);

  // Metodi scorciatoia
  const get = useCallback((endpoint: string, options?: RequestInit) => request(endpoint, { method: 'GET', ...options }), [request]);  const post = useCallback(<T = unknown>(endpoint: string, body?: T) => request(endpoint, { method: 'POST', body: body ? JSON.stringify(body) : undefined }), [request]);
  const patch = useCallback(<T = unknown>(endpoint: string, body: T) => request(endpoint, { method: 'PATCH', body: JSON.stringify(body) }), [request]);
  const del = useCallback((endpoint: string) => request(endpoint, { method: 'DELETE' }), [request]);

  return { get, post, patch, delete: del, request };
};