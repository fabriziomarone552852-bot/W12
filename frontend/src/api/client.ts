// src/api/client.ts
import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

// 1. LA LOGICA DI TUO PADRE (Perfetta)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export function apiUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}

// 2. CREIAMO AXIOS USANDO L'URL DI TUO PADRE
export const apiClient = axios.create({
  baseURL: API_BASE_URL 
});

// 3. IL VIGILE IN USCITA (Attacca il token)
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  }, 
  (error: unknown) => Promise.reject(error)
);


// === VARIABILI PER LA GESTIONE DELLA RACE CONDITION ===

// Creiamo un'interfaccia dedicata per pulire la definizione della coda
interface QueuedRequest {
  resolve: (token: string) => void;
  // Sostituiamo "any" con "unknown", la best practice per le Promise rejection
  reject: (error?: unknown) => void; 
}

// isRefreshing fa da "Semaforo Rosso"
let isRefreshing = false;
// failedQueue è la "Sala d'attesa" tipizzata
let failedQueue: QueuedRequest[] = [];

// Funzione per svuotare la sala d'attesa (Senza any!)
const processQueue = (error: unknown | null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};
// =======================================================


// Estendiamo la configurazione nativa di Axios per includere il nostro flag custom "_retry"
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Interfaccia per la risposta attesa dal refresh
interface RefreshResponse {
  access_token: string;
  refresh_token?: string;
}

// 4. IL VIGILE IN ENTRATA (Rinnova il token se scade)
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // Tipizziamo esplicitamente la richiesta originale con la nostra interfaccia estesa
    const originalRequest = error.config as CustomAxiosRequestConfig | undefined;

    // Aggiungiamo un check di sicurezza su originalRequest
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        window.dispatchEvent(new Event('force-logout'));
        return Promise.reject(error);
      }

      // 🚦 SE IL SEMAFORO È ROSSO (qualcun altro sta già facendo il refresh)
      if (isRefreshing) {
        // Tipizziamo esplicitamente la Promise come <string>
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          if (originalRequest.headers) {
             originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return apiClient(originalRequest); 
        }).catch((err: unknown) => {
          return Promise.reject(err);
        });
      }

      // 🟢 SE IL SEMAFORO È VERDE, lo facciamo diventare ROSSO
      isRefreshing = true;

      try {
        // Diamo un tipo anche al risultato di axios.post, così response.data non sarà 'any'
        const response = await axios.post<RefreshResponse>(apiUrl('/refresh'), {
          refresh_token: refreshToken
        });

        const { access_token } = response.data;
        
        // Salviamo i nuovi token
        localStorage.setItem('token', access_token);
        if (response.data.refresh_token) {
          localStorage.setItem('refreshToken', response.data.refresh_token);
        }

        // 🟢 Operazione finita! Sblocchiamo la sala d'attesa
        processQueue(null, access_token);

        // 🪄 FIX: Riprova la chiamata originale usando apiClient!
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }
        return apiClient(originalRequest);
        
      } catch (refreshError: unknown) {
        processQueue(refreshError, null);
        window.dispatchEvent(new Event('force-logout'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);