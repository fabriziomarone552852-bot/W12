const API_URL = import.meta.env.VITE_API_URL as string;

export function apiUrl(path: string) {
  return `${API_URL}${path}`;
}