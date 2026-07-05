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
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<any>; // Usiamo any per catturare il formato FastAPI
      
      if (axiosError.response) {
        const errorData = axiosError.response.data;
        let errorMessage = `Errore API: ${axiosError.response.status}`;

        // 1. Se FastAPI ci manda un Array di errori (Errore 422 classico)
        if (Array.isArray(errorData?.detail)) {
          errorMessage = errorData.detail
            .map((err: any) => `${err.loc.join(' -> ')}: ${err.msg}`)
            .join(' | ');
        } 
        // 2. Se è una stringa semplice
        else if (typeof errorData?.detail === 'string') {
          errorMessage = errorData.detail;
        } 
        // 3. Fallback sul message
        else if (errorData?.message) {
          errorMessage = errorData.message;
        }

        throw new Error(errorMessage);
      }
    }
    
    // Errore generico (Rete assente, server down)
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