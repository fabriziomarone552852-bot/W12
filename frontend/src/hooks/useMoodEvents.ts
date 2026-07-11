import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/hooks/useApi';
import type { DailyEntry, MoodEvent, MoodEventType, CreateMoodPayload } from '@/types';
import type { ApiClient } from '@/hooks/useApi';

export const useMoodEvents = (mondayStr: string, sundayStr: string) => {
  const queryClient = useQueryClient();
  
  // Cast sicuro di api basato sull'interfaccia ApiClient creata al Passo 1
  const api = useApi() as unknown as ApiClient;
  
  const queryKey = ['moodEvents', mondayStr, sundayStr];

  // 1. LETTURA DEI DATI CON CACHING (RAM)
  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async (): Promise<{ positive: MoodEvent[]; negative: MoodEvent[] }> => {
      // Passiamo il tipo atteso <DailyEntry[]> al Generic del metodo GET
      const response = await api.get<DailyEntry[]>(
        `/daily-entries?start_date=${mondayStr}&end_date=${sundayStr}`
      );

      // Filtriamo e mappiamo i dati in modo puramente tipizzato
      const positive = response
        .filter((e) => e.tipo === 'EP')
        .map((e) => ({
          id: e.id,
          title: e.testo,
          type: 'EP' as MoodEventType,
          date: e.data_riferimento.substring(0, 10),
        }));

      const negative = response
        .filter((e) => e.tipo === 'EN')
        .map((e) => ({
          id: e.id,
          title: e.testo,
          type: 'EN' as MoodEventType,
          date: e.data_riferimento.substring(0, 10),
        }));

      return { positive, negative };
    },
    // Mantieni i dati in RAM come validi per 5 minuti per evitare fetch continui ad ogni render
    staleTime: 5 * 60 * 1000, 
  });

  // 2. MUTAZIONE: AGGIUNTA EVENTO (Con Optimistic UI / Cache locale)
  const addMoodMutation = useMutation({
    mutationFn: async (payload: CreateMoodPayload) => {
      return await api.post<DailyEntry, CreateMoodPayload>('/daily-entries', payload);
    },
    onSuccess: (newEntry) => {
      // Aggiorna istantaneamente la RAM senza fare un nuovo fetch di rete completo
      queryClient.setQueryData<{ positive: MoodEvent[]; negative: MoodEvent[] }>(queryKey, (oldData) => {
        if (!oldData) return { positive: [], negative: [] };
        
        const mappedNewEvent: MoodEvent = {
          id: newEntry.id,
          title: newEntry.testo,
          type: newEntry.tipo as MoodEventType,
          date: newEntry.data_riferimento,
        };

        return {
          positive: newEntry.tipo === 'EP' ? [...oldData.positive, mappedNewEvent] : oldData.positive,
          negative: newEntry.tipo === 'EN' ? [...oldData.negative, mappedNewEvent] : oldData.negative,
        };
      });
    },
  });

  // 3. MUTAZIONE: AGGIORNAMENTO EVENTO
  const updateMoodMutation = useMutation({
    mutationFn: async ({ id, title }: { id: number; title: string }) => {
      return await api.patch<DailyEntry, { testo: string }>(`/daily-entries/${id}`, { testo: title });
    },
    onSuccess: (updatedEntry) => {
      queryClient.setQueryData<{ positive: MoodEvent[]; negative: MoodEvent[] }>(queryKey, (oldData) => {
        if (!oldData) return { positive: [], negative: [] };
        
        const updateItem = (list: MoodEvent[]) =>
          list.map((item) => (item.id === updatedEntry.id ? { ...item, title: updatedEntry.testo } : item));

        return {
          positive: updatedEntry.tipo === 'EP' ? updateItem(oldData.positive) : oldData.positive,
          negative: updatedEntry.tipo === 'EN' ? updateItem(oldData.negative) : oldData.negative,
        };
      });
    },
  });

  // 4. MUTAZIONE: ELIMINAZIONE EVENTO
  const deleteMoodMutation = useMutation({
    mutationFn: async (id: number) => {
      return await api.delete<void>(`/daily-entries/${id}`);
    },
    onSuccess: (_, id) => {
      queryClient.setQueryData<{ positive: MoodEvent[]; negative: MoodEvent[] }>(queryKey, (oldData) => {
        if (!oldData) return { positive: [], negative: [] };

        return {
          positive: oldData.positive.filter((ev) => ev.id !== id),
          negative: oldData.negative.filter((ev) => ev.id !== id),
        };
      });
    },
  });

  return {
    positiveEvents: data?.positive ?? [],
    negativeEvents: data?.negative ?? [],
    isLoadingMoods: isLoading,
    addMood: (type: MoodEventType, text: string) => 
      addMoodMutation.mutateAsync({ tipo: type, testo: text, data_riferimento: mondayStr }),
    updateMood: (id: number, title: string) => 
      updateMoodMutation.mutate({ id, title }),
    deleteMood: (id: number) => 
      deleteMoodMutation.mutate(id),
  };
};