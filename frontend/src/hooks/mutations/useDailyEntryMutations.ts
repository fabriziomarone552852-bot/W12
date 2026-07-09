// frontend/src/hooks/mutations/useDailyEntryMutations.ts
import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useApi } from '../useApi';
import type { DailyEntry } from '@/types';

export interface SaveDailyEntryPayload {
  id?: number;
  tipo: DailyEntry['tipo'];
  text: string;
  dateStr: string;
}

export interface CacheWithDailyEntries {
  obiettivi?: DailyEntry[];
  priorita?: DailyEntry[];
  obiettivo_settimanale?: DailyEntry | null;
  priorita_settimanali?: DailyEntry[];
  eventi_positivi?: DailyEntry[];
  eventi_negativi?: DailyEntry[];
}

export function useDailyEntryMutations<T extends CacheWithDailyEntries>(queryKey: QueryKey) {
  const api = useApi();
  const queryClient = useQueryClient();

  const saveEntryMutation = useMutation({
    mutationFn: async (payload: SaveDailyEntryPayload) => {
      const data = { data_riferimento: payload.dateStr, tipo: payload.tipo, testo: payload.text };
      if (payload.id && !payload.text.trim()) {
        await api.delete(`/daily-entries/${payload.id}`);
        return { deleted: true, id: payload.id };
      }
      if (!payload.text.trim()) return null;
      return payload.id 
        ? await api.patch<DailyEntry>(`/daily-entries/${payload.id}`, data) 
        : await api.post<DailyEntry>('/daily-entries', data);
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData<T>(queryKey);

      const tempId = payload.id || Date.now();
      const isDelete = !payload.text.trim() && payload.id;
      
      const entry: DailyEntry = {
        id: tempId,
        data_riferimento: payload.dateStr,
        tipo: payload.tipo,
        testo: payload.text,
        user_id: 0
      };

      queryClient.setQueryData<T>(queryKey, (old) => {
        if (!old) return old;

        const updateArray = (list: DailyEntry[] = []) => {
          if (isDelete) return list.filter(item => item.id !== payload.id);
          const exists = list.some(item => item.id === tempId);
          return exists ? list.map(item => item.id === tempId ? entry : item) : [...list, entry];
        };

        switch (payload.tipo) {
          case 'OD': return { ...old, obiettivi: updateArray(old.obiettivi) };
          case 'PD': return { ...old, priorita: updateArray(old.priorita) };
          case 'OW': return { ...old, obiettivo_settimanale: isDelete ? null : entry };
          case 'PW': return { ...old, priorita_settimanali: updateArray(old.priorita_settimanali) };
          case 'EP': return { ...old, eventi_positivi: updateArray(old.eventi_positivi) };
          case 'EN': return { ...old, eventi_negativi: updateArray(old.eventi_negativi) };
          default: return old;
        }
      });

      return { previousData, tempId };
    },
    onError: (err, payload, context) => {
      console.error("Errore salvataggio daily entry:", err);
      if (context?.previousData) queryClient.setQueryData(queryKey, context.previousData);
    },
    onSuccess: (savedEntryFromDB, payload, context) => {
      if (!savedEntryFromDB || 'deleted' in savedEntryFromDB) return;

      if (!payload.id && context?.tempId) {
        queryClient.setQueryData<T>(queryKey, (old) => {
          if (!old) return old;

          const tempId = context.tempId;
          const swapEntry = (list: DailyEntry[] = []) => 
            list.map(item => item.id === tempId ? (savedEntryFromDB as DailyEntry) : item);

          switch (payload.tipo) {
            case 'OD': return { ...old, obiettivi: swapEntry(old.obiettivi) };
            case 'PD': return { ...old, priorita: swapEntry(old.priorita) };
            case 'OW': return { ...old, obiettivo_settimanale: savedEntryFromDB as DailyEntry };
            case 'PW': return { ...old, priorita_settimanali: swapEntry(old.priorita_settimanali) };
            case 'EP': return { ...old, eventi_positivi: swapEntry(old.eventi_positivi) };
            case 'EN': return { ...old, eventi_negativi: swapEntry(old.eventi_negativi) };
            default: return old;
          }
        });
      }
    },
  });

  return { saveDailyEntry: saveEntryMutation.mutate };
}