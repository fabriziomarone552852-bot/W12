// src/components/day/useCountdownWidget.ts
import { useState, useEffect, useRef } from 'react';
import type { CountdownItem } from '@/components/day/CountdownWidget'; // Assicurati che il percorso sia corretto

export const useCountdownWidget = (countdowns: CountdownItem[]) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Usiamo un ref per ricordare quali countdown hanno già fatto "esplosione".
  // Inizializziamo il Set con i countdown CHE SONO GIÀ SCADUTI al caricamento della pagina,
  // così l'app non salta continuamente sulle vecchie card appena la apri!
  const notifiedSet = useRef<Set<number>>(
    new Set(
      countdowns
        .filter(cd => new Date(cd.targetDateStr).getTime() <= Date.now())
        .map(cd => cd.id)
    )
  );

  // EFFETTO 1: ROTAZIONE NORMALE (Ogni 10 secondi)
  useEffect(() => {
    if (countdowns.length <= 1) return;

    const rotateInterval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % countdowns.length);
    }, 10000);

    return () => clearInterval(rotateInterval);
    
    // IL TRUCCO: Mettendo currentIndex tra le dipendenze, ogni volta che forziamo 
    // un cambio di indice (es. al momento della scadenza), questo useEffect 
    // si cancella e riparte da zero. Regalando esattamente 10 secondi di focus!
  }, [countdowns.length, currentIndex]);


  // EFFETTO 2: CONTROLLO SCADENZE "LIVE" (Ogni 1 secondo)
  useEffect(() => {
    if (countdowns.length === 0) return;

    const checkInterval = setInterval(() => {
      const now = Date.now();
      let justExpiredIdx = -1;

      for (let i = 0; i < countdowns.length; i++) {
        const item = countdowns[i];
        const targetTime = new Date(item.targetDateStr).getTime();
        
        // Se è appena scaduto E non l'abbiamo ancora notificato
        if (now >= targetTime && !notifiedSet.current.has(item.id)) {
          notifiedSet.current.add(item.id);
          justExpiredIdx = i;
          break; // Ci fermiamo al primo che troviamo
        }
      }

      // Se ne è scaduto uno proprio ora, spostiamo il carosello su di lui!
      if (justExpiredIdx !== -1) {
        setCurrentIndex(justExpiredIdx);
      }
    }, 1000);

    return () => clearInterval(checkInterval);
  }, [countdowns]);

  return {
    currentIndex,
    setCurrentIndex
  };
};