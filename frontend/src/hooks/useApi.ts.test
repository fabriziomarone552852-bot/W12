// src/hooks/useApi.ts
import { useCallback } from 'react';
import { apiClient } from '@/api/client';
import axios, { type AxiosRequestConfig } from 'axios';

interface ValidationDetailItem {
  loc?: Array<string | number>;
  msg?: string;
  type?: string;
}

interface ApiErrorData {
  detail?: string | ValidationDetailItem[] | Record<string, unknown>;
  message?: string;
}

export const useApi = () => {
  const handleAxiosError = (error: unknown): never => {
    if (axios.isAxiosError<ApiErrorData>(error) && error.response) {
      const detail = error.response.data?.detail;
      const message = error.response.data?.message;

      if (Array.isArray(detail)) {
        const readable = detail
          .map((item) => {
            const path = item.loc?.join('.') ?? 'body';
            const msg = item.msg ?? 'Valore non valido';
            return `${path}: ${msg}`;
          })
          .join(' | ');

        throw new Error(readable || `Errore API: ${error.response.status}`);
      }

      if (typeof detail === 'string' && detail.trim()) {
        throw new Error(detail);
      }

      if (detail && typeof detail === 'object') {
        throw new Error(JSON.stringify(detail));
      }

      if (typeof message === 'string' && message.trim()) {
        throw new Error(message);
      }

      throw new Error(`Errore API: ${error.response.status}`);
    }

    const genericError = error as Error;
    throw new Error(genericError?.message || 'Errore di rete o server non raggiungibile');
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
    } catch (error) {
      return handleAxiosError(error);
    }
  }, []);

  const patch = useCallback(async <T = unknown>(endpoint: string, body: T) => {
    try {
      const response = await apiClient.patch(endpoint, body);
      return response.status === 204 ? null : response.data;
    } catch (error) {
      return handleAxiosError(error);
    }
  }, []);

  const del = useCallback(async (endpoint: string) => {
    try {
      const response = await apiClient.delete(endpoint);
      return response.status === 204 ? null : response.data;
    } catch (error) {
      return handleAxiosError(error);
    }
  }, []);

  return { get, post, patch, delete: del, del };
};