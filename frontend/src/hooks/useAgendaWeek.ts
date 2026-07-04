// frontend/src/hooks/useAgendaWeek.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from './useApi';

// Importiamo i tipi che abbiamo appena definito per mantenere lo zero-any
import type { Task, SyncWeekResponse } from '@/types';

// Interfaccia rigorosa per il payload di salvataggio
export interface SaveWeeklyEntryPayload {
  id?: number;
  tipo: 'OS' | 'PS' | 'EP' | 'EN' | 'N1' | 'N2' | 'N3' | 'N4';
  text: string;
  dateStr: string; // Sarà SEMPRE la data del lunedì formattata YYYY-MM-DD
}

export const useAgendaWeek = (mondayStr: string, sundayStr: string) => {
  const api = useApi();
  const queryClient = useQueryClient();

  // 1. FETCH DATI DELLA SETTIMANA
  const { data: weekData, isLoading, isError } = useQuery({
    queryKey: ['weekSync', mondayStr], // La cache si basa sul lunedì
    queryFn: async () => {
      // Chiamata all'endpoint che abbiamo creato nel backend (Router-Service)
      const rawData = await api.get(`/sync/week?start_date=${mondayStr}&end_date=${sundayStr}`);
      
      // Asserzione del tipo per TypeScript
      return rawData as SyncWeekResponse;
    }
  });

  // 2. MUTAZIONE UNIVERSALE PER LE VOCI SETTIMANALI
  // Gestisce Obiettivo Settimanale (OS), Priorità (PS), Eventi Positivi (EP), Eventi Negativi (EN) e Note (N1-N4)
  const saveWeeklyEntryMutation = useMutation({
    mutationFn: (payload: SaveWeeklyEntryPayload) => {
      const data = { 
        data_riferimento: payload.dateStr, 
        tipo: payload.tipo, 
        testo: payload.text 
      };
      
      // Se c'è un ID (esisteva già) ma il testo è stato svuotato dall'utente, lo eliminiamo dal DB
      if (payload.id && !payload.text.trim()) {
        return api.delete(`/daily-entries/${payload.id}`);
      }
      
      // Se il testo è vuoto e non c'è ID (è nuovo), non facciamo nessuna chiamata inutile
      if (!payload.text.trim()) return Promise.resolve();

      // Altrimenti creiamo (POST) o aggiorniamo (PATCH)
      return payload.id 
        ? api.patch(`/daily-entries/${payload.id}`, data)
        : api.post('/daily-entries', data);
    },
    onSuccess: () => {
      // Invalida la cache per forzare un ricaricamento automatico
      queryClient.invalidateQueries({ queryKey: ['weekSync', mondayStr] });
    }
  });

  // 3. MUTAZIONE PER IL TOGGLE DEI TASK (Riciclata in modo intelligente)
  const toggleTaskMutation = useMutation({
    mutationFn: ({ id, isDone }: { id: number; isDone: boolean }) => 
      api.patch(`/tasks/${id}`, { fatto: !isDone }),
    
    // Optimistic Update: Aggiorniamo istantaneamente la UI senza aspettare il server
    onMutate: async ({ id, isDone }) => {
      await queryClient.cancelQueries({ queryKey: ['weekSync', mondayStr] });
      const previousData = queryClient.getQueryData<SyncWeekResponse>(['weekSync', mondayStr]);

      if (previousData) {
        queryClient.setQueryData<SyncWeekResponse>(['weekSync', mondayStr], {
          ...previousData,
          tasks: previousData.tasks.map((t: Task) => 
            t.id === id ? { ...t, fatto: !isDone } : t
          )
        });
      }

      return { previousData };
    },
    onError: (_err, _newVal, context) => {
      // Se fallisce, torniamo al dato precedente
      if (context?.previousData) {
        queryClient.setQueryData(['weekSync', mondayStr], context.previousData);
      }
    },
    onSettled: () => {
      // Indipendentemente da successo o errore, ri-sincronizziamo in background
      queryClient.invalidateQueries({ queryKey: ['weekSync', mondayStr] });
    }
  });

  // Esponiamo i metodi puliti al componente UI
  return {
    weekData,
    isLoading,
    isError,
    saveWeeklyEntry: saveWeeklyEntryMutation.mutateAsync,
    toggleTask: toggleTaskMutation.mutateAsync,
  };
};