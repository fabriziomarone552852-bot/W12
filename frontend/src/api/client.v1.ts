const API_URL = window.APP_CONFIG.API_BASE_URL;

export function apiUrl(path: string) {
  return `${API_URL}${path}`;
}