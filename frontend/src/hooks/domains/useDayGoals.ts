// src/hooks/domains/useDayGoals.ts
import { useState } from 'react';
import { formatDateString } from '../../utils/dateUtils';
import type { DailyEntry } from '../../types';

export const useDayGoals = (api: any, dataRiferimento: Date) => {
  const [obiettivoRaw, setObiettivoRaw] = useState<DailyEntry | null>(null);
  const [prioritaRaw, setPrioritaRaw] = useState<(DailyEntry | null)[]>([null, null, null]);

  const [obiettivoText, setObiettivoText] = useState<string>("");
  const [prioritaTexts, setPrioritaTexts] = useState<string[]>(["", "", ""]);

  const setSinglePrioritaText = (index: number, text: string) => {
    setPrioritaTexts(prev => {
      const updated = [...prev];
      updated[index] = text;
      return updated;
    });
  };

  const saveObiettivo = async () => {
    const dateStr = formatDateString(dataRiferimento);
    const textToSave = obiettivoText.trim();

    if (!textToSave) {
      if (obiettivoRaw?.id) {
        try {
          await api.delete(`/daily-entries/${obiettivoRaw.id}`);
          setObiettivoRaw(null);
        } catch (e) { console.error(e); }
      }
      return;
    }

    try {
      const isUpdate = typeof obiettivoRaw?.id === 'number';
      const payload = { data_riferimento: dateStr, tipo: 'Obiettivo', testo: textToSave };
      
      const data = isUpdate 
        ? await api.patch(`/daily-entries/${obiettivoRaw.id}`, payload)
        : await api.post('/daily-entries', payload);

      setObiettivoRaw(data);
    } catch (error) { console.error("Errore nel salvataggio dell'obiettivo:", error); }
  };

  const savePriorita = async (index: number) => {
    const dateStr = formatDateString(dataRiferimento);
    const currentText = prioritaTexts[index].trim();
    const currentRaw = prioritaRaw[index];

    if (!currentText) {
      if (currentRaw?.id) {
        try {
          await api.delete(`/daily-entries/${currentRaw.id}`);
          setPrioritaRaw(prev => {
            const updated = [...prev];
            updated[index] = null;
            return updated;
          });
        } catch (e) { console.error(e); }
      }
      return;
    }

    try {
      const isUpdate = typeof currentRaw?.id === 'number';
      const payload = { data_riferimento: dateStr, tipo: 'Priorità', testo: currentText };

      const data = isUpdate
        ? await api.patch(`/daily-entries/${currentRaw.id}`, payload)
        : await api.post('/daily-entries', payload);
      
      setPrioritaRaw(prev => {
        const updated = [...prev];
        updated[index] = data;
        return updated;
      });
    } catch (error) { console.error(`Errore salvataggio priorità ${index + 1}:`, error); }
  };

  return {
    obiettivoRaw, setObiettivoRaw,
    prioritaRaw, setPrioritaRaw,
    obiettivoText, setObiettivoText,
    prioritaTexts, setPrioritaTexts,
    setSinglePrioritaText,
    saveObiettivo,
    savePriorita
  };
};