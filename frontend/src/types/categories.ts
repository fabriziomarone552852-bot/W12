export interface Category {
  id: number;
  name: string;
  colore: string | null;
  user_id: number | null;
  genre: number;
}

export interface CategoryCreatePayload {
  name: string;
  colore?: string | null;
  genre?: number;
}