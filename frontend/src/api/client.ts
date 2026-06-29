export function apiUrl(path: string) {
  if (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) {
    return `${window.APP_CONFIG.API_BASE_URL}${path}`;
  } else {
    console.error(
      'APP_CONFIG o API_BASE_URL non definiti al momento della chiamata. Controlla config.json e main.tsx.'
    );
    // Fallback: path relativo per non bloccare l'app,
    // ma la console ti avviserà che c'è un problema.
    return path;
  }
}