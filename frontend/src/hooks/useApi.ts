// src/hooks/useApi.ts
import { useCallback } from 'react';
import { apiClient } from '@/api/client'; 
import axios, { AxiosError, type AxiosRequestConfig } from 'axios';

// 1. IL CONTRATTO (Aggiornato per supportare le options di Axios e i tipi di ritorno)
export interface ApiClient {
  get: <T = any>(url: string, options?: AxiosRequestConfig) => Promise<T>;
  post: <T = any, D = unknown>(url: string, data?: D) => Promise<T>;
  patch: <T = any, D = unknown>(url: string, data: D) => Promise<T>;
  delete: <T = any>(url: string) => Promise<T>;
}

interface ApiErrorData {
  detail?: string | { loc: (string | number)[]; msg: string; type: string }[];
  message?: string;
}

// 2. L'IMPLEMENTAZIONE (Dichiariamo che ritorna un ApiClient)
export const useApi = (): ApiClient => {

  const handleAxiosError = (error: unknown): never => {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiErrorData>; 
      
      if (axiosError.response) {
        const errorData = axiosError.response.data;
        let errorMessage = `Errore API: ${axiosError.response.status}`;

        // Errore 422 di FastAPI
        if (Array.isArray(errorData?.detail)) {
          errorMessage = errorData.detail
            .map((err) => `${err.loc.join(' -> ')}: ${err.msg}`)
            .join(' | ');
        } 
        else if (typeof errorData?.detail === 'string') {
          errorMessage = errorData.detail;
        } 
        else if (errorData?.message) {
          errorMessage = errorData.message;
        }

        throw new Error(errorMessage);
      }
    }
    
    const genericError = error as Error;
    throw new Error(genericError.message || "Errore di rete o server non raggiungibile");
  };

  // 3. I METODI (Ora accettano <T> per la risposta e <D> per il payload)
  
  const get = useCallback(async <T = any>(endpoint: string, options?: AxiosRequestConfig): Promise<T> => {
    try {
      const response = await apiClient.get<T>(endpoint, options);
      // Il cast "as unknown as T" serve per rassicurare TypeScript quando torniamo null
      return response.status === 204 ? (null as unknown as T) : response.data;
    } catch (error) { 
      return handleAxiosError(error); 
    }
  }, []);

  const post = useCallback(async <T = any, D = unknown>(endpoint: string, body?: D): Promise<T> => {
    try {
      const response = await apiClient.post<T>(endpoint, body);
      return response.status === 204 ? (null as unknown as T) : response.data;
    } catch (error) { 
      return handleAxiosError(error); 
    }
  }, []);

  const patch = useCallback(async <T = any, D = unknown>(endpoint: string, body: D): Promise<T> => {
    try {
      const response = await apiClient.patch<T>(endpoint, body);
      return response.status === 204 ? (null as unknown as T) : response.data;
    } catch (error) { 
      return handleAxiosError(error); 
    }
  }, []);

  const del = useCallback(async <T = any>(endpoint: string): Promise<T> => {
    try {
      const response = await apiClient.delete<T>(endpoint);
      return response.status === 204 ? (null as unknown as T) : response.data;
    } catch (error) { 
      return handleAxiosError(error); 
    }
  }, []);

  return { get, post, patch, delete: del };
};