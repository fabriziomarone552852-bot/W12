// src/hooks/useApi.ts
import { useCallback } from 'react';
import { apiClient } from '@/api/client'; 
import axios, { AxiosError, type AxiosRequestConfig } from 'axios';

interface ApiErrorData {
  detail?: string;
  message?: string;
}

export const useApi = () => {
  // Non ci serve più useAuth() qui dentro! L'interceptor fa tutto da solo.

  // Funzione per formattare gli errori esattamente come facevi prima
  // 🪄 3. (error: unknown) è la best-practice. Non diamo nulla per scontato!
  const handleAxiosError = (error: unknown) => {
    // Verifichiamo se è un errore generato da Axios
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiErrorData>;
      if (axiosError.response) {
        throw new Error(
          axiosError.response.data?.detail || 
          axiosError.response.data?.message || 
          `Errore API: ${axiosError.response.status}`
        );
      }
    }
    
    // Se è un errore generico (es. internet staccato)
    const genericError = error as Error;
    throw new Error(genericError.message || "Errore di rete o server non raggiungibile");
  };

  const get = useCallback(async (endpoint: string, options?: AxiosRequestConfig) => {
    try {
      const response = await apiClient.get(endpoint, options);
      return response.status === 204 ? null : response.data;
    } catch (error) { 
      return handleAxiosError(error); 
    }
  }, []);

  const post = useCallback(async <T = unknown>(endpoint: string, body?: T) => {
    try {
      const response = await apiClient.post(endpoint, body);
      return response.status === 204 ? null : response.data;
    } catch (error) { return handleAxiosError(error); }
  }, []);

  const patch = useCallback(async <T = unknown>(endpoint: string, body: T) => {
    try {
      const response = await apiClient.patch(endpoint, body);
      return response.status === 204 ? null : response.data;
    } catch (error) { return handleAxiosError(error); }
  }, []);

  const del = useCallback(async (endpoint: string) => {
    try {
      const response = await apiClient.delete(endpoint);
      return response.status === 204 ? null : response.data;
    } catch (error) { return handleAxiosError(error); }
  }, []);

  return { get, post, patch, delete: del };
};