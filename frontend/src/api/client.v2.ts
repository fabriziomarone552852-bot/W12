let API_URL = '';

if (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) {
  API_URL = window.APP_CONFIG.API_BASE_URL;
} else {
  console.error(
    'APP_CONFIG o API_BASE_URL non definiti. Controlla config.json e main.tsx.'
  );
}

export function apiUrl(path: string) {
  return `${API_URL}${path}`;
}