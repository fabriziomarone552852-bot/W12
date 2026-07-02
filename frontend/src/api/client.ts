// src/api/client.ts
import axios from 'axios';

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
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));


// === VARIABILI PER LA GESTIONE DELLA RACE CONDITION ===
// isRefreshing fa da "Semaforo Rosso"
let isRefreshing = false;
// failedQueue è la "Sala d'attesa" per le richieste fallite
let failedQueue: Array<{ resolve: (token: string) => void, reject: (err: any) => void }> = [];

// Funzione per svuotare la sala d'attesa
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token as string);
    }
  });
  failedQueue = [];
};
// =======================================================


// 4. IL VIGILE IN ENTRATA (Rinnova il token se scade)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Se l'errore è 401 (Scaduto) e non abbiamo ancora provato a riprovare questa specifica richiesta
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        window.dispatchEvent(new Event('force-logout'));
        return Promise.reject(error);
      }

      // 🚦 SE IL SEMAFORO È ROSSO (qualcun altro sta già facendo il refresh)
      if (isRefreshing) {
        // Mettiamo questa richiesta nella sala d'attesa (Promessa in sospeso)
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          // 🪄 FIX: Usiamo apiClient per riprovare, non axios standard!
          // Modifichiamo l'header per sicurezza (anche se apiClient lo farebbe da solo)
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest); 
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      // 🟢 SE IL SEMAFORO È VERDE, lo facciamo diventare ROSSO
      isRefreshing = true;

      try {
        // Facciamo il vero e unico refresh usando axios BASE (corretto, per evitare loop!)
        const response = await axios.post(apiUrl('/refresh'), {
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
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return apiClient(originalRequest);
        
      } catch (refreshError) {
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