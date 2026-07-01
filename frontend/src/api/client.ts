import axios from 'axios';

// 1. LA LOGICA DI TUO PADRE (Perfetta)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export function apiUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}

// 2. CREIAMO AXIOS USANDO L'URL DI TUO PADRE
export const apiClient = axios.create({
  baseURL: API_BASE_URL // Ora Axios sa già da solo dove puntare!
});

// 3. IL VIGILE IN USCITA (Attacca il token)
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// 4. IL VIGILE IN ENTRATA (Rinnova il token se scade)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (refreshToken) {
        try {
          // Chiamata di refresh senza passare dall'interceptor
          const response = await axios.post(apiUrl('/refresh'), {
            refresh_token: refreshToken
          });

          const { access_token } = response.data;
          
          localStorage.setItem('token', access_token);
          if (response.data.refresh_token) {
            localStorage.setItem('refreshToken', response.data.refresh_token);
          }

          // Riprova la chiamata originale col nuovo token
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return axios(originalRequest);
          
        } catch (refreshError) {
          window.dispatchEvent(new Event('force-logout'));
          return Promise.reject(refreshError);
        }
      } else {
        window.dispatchEvent(new Event('force-logout'));
      }
    }
    return Promise.reject(error);
  }
);