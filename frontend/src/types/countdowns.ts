export interface Countdown {
  id: number;
  user_id: number;
  title: string;
  target_date: string; 
  status: 'active' | 'closed';
  immagine_url?: string | null;
  created_at: string; 
  updated_at?: string | null;
  closed_at?: string | null;
  reopened_at?: string | null;
}

export interface RawCountdown {
  id: number;
  title?: string;             
  testo?: string;             
  target_date?: string;       
  data_riferimento?: string;  
  immagine_url?: string | null;
}