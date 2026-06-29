// src/hooks/domains/useDayCountdowns.ts
import { useState } from 'react';
import type { Countdown } from '../../types';

interface SaveCountdownPayload {
  id?: number;
  targetDateStr?: string;
  title?: string;
  imageUrl?: string;
}

export const useDayCountdowns = (api: any) => {
  const [countdownsRaw, setCountdownsRaw] = useState<Countdown[]>([]);

  const saveCountdown = async (countdown: SaveCountdownPayload) => {
    try {
      const isUpdate = typeof countdown.id === 'number' && countdown.id < 1000000000;
      const rawDate = countdown.targetDateStr || new Date().toISOString();
      const payload = {
        title: countdown.title || "Nuovo Countdown",
        target_date: rawDate.substring(0, 10),
        immagine_url: countdown.imageUrl || null
      };

      if (isUpdate) {
        const updated = await api.patch(`/countdowns/${countdown.id}`, payload);
        setCountdownsRaw(prev => prev.map(c => c.id === countdown.id ? updated : c));
      } else {
        const created = await api.post('/countdowns', payload);
        setCountdownsRaw(prev => [...prev, created]);
      }
    } catch (error) { 
      console.error("Errore salvataggio countdown:", error); 
    }
  };

  const deleteCountdown = async (id: number) => {
    try {
      await api.delete(`/countdowns/${id}`);
      setCountdownsRaw(prev => prev.filter(c => c.id !== id));
    } catch (error) { 
      console.error("Errore eliminazione countdown:", error); 
    }
  };

  return { 
    countdownsRaw, 
    setCountdownsRaw, 
    saveCountdown, 
    deleteCountdown 
  };
};