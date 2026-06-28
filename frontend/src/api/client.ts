const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').trim().replace(/\/$/, '');

export function apiUrl(path: string) {
  if (API_BASE_URL) {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${API_BASE_URL}${normalizedPath}`;
  } else {
    console.error(
      'VITE_API_BASE_URL non definita. Controlla i file env del frontend.'
    );
    return path;
  }
}