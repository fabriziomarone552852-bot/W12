// src/utils/rruleUtils.ts
import { RRule, rrulestr } from 'rrule';

// Aggiunto il secondo parametro opzionale: startDateStr
// Aggiungiamo il secondo parametro opzionale: startDateStr
export const translateRRule = (rruleString?: string, startDateStr?: string): string => {
  if (!rruleString) return 'Tutti i giorni';

  try {
    const rule = rrulestr(rruleString);
    const options = rule.options;
    const interval = options.interval || 1;

    let base = '';
    if (options.freq === RRule.DAILY) base = interval === 1 ? 'Tutti i giorni' : `Ogni ${interval} giorni`;
    else if (options.freq === RRule.WEEKLY) base = interval === 1 ? 'Ogni settimana' : `Ogni ${interval} settimane`;
    else if (options.freq === RRule.MONTHLY) base = interval === 1 ? 'Ogni mese' : `Ogni ${interval} mesi`;
    else if (options.freq === RRule.YEARLY) base = interval === 1 ? 'Ogni anno' : `Ogni ${interval} anni`;

    // 1. PRIMA SCELTA: Giorni specifici indicati ESPLICITAMENTE nella stringa (es. BYDAY=MO,WE)
    // 🪄 FIX: Aggiungiamo rruleString.includes('BYDAY') per evitare i giorni "fantasma" inventati dalla libreria!
    if (rruleString.includes('BYDAY') && options.byweekday && options.byweekday.length > 0) {
      const daysMap: Record<number, string> = {
        0: 'Lunedì', 1: 'Martedì', 2: 'Mercoledì',
        3: 'Giovedì', 4: 'Venerdì', 5: 'Sabato', 6: 'Domenica'
      };
      
      const days = options.byweekday.map((d: any) => daysMap[d.weekday !== undefined ? d.weekday : d]).join(', ');
      return `${base} di ${days}`;
    } 
    
    // 2. SECONDA SCELTA: Settimanale senza BYDAY esplicito, usiamo la nostra data di inizio sicura
    if (options.freq === RRule.WEEKLY && startDateStr) {
      // Tagliamo eventuali orari e prendiamo solo YYYY-MM-DD
      const [year, month, day] = startDateStr.split('T')[0].split('-').map(Number);
      
      // Fissiamo la data a mezzogiorno per evitare salti dovuti al cambio di ora legale (DST)!
      const safeDate = new Date(year, month - 1, day, 12, 0, 0);
      
      let dayName = safeDate.toLocaleDateString('it-IT', { weekday: 'long' });
      // Capitalizziamo la prima lettera (lunedì -> Lunedì)
      dayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);
      
      return `${base} di ${dayName}`;
    }

    return base; 
  } catch (e) {
    console.error("Impossibile tradurre RRULE:", e);
    return 'Regola personalizzata';
  }
};

// 2. Da stringa RRULE a variabili per popolare i Form React
export const parseRRule = (rruleString?: string) => {
  if (!rruleString) return { isRecurrent: false, freq: 'WEEKLY', interval: '1', until: '' };

  try {
    const rule = rrulestr(rruleString);
    const options = rule.options;
    
    const freqMap = ['YEARLY', 'MONTHLY', 'WEEKLY', 'DAILY', 'HOURLY', 'MINUTELY', 'SECONDLY'];
    
    // Siccome l'UNTIL potrebbe non avere la 'Z' (grazie alla nostra modifica sotto), 
    // lo formattiamo a mano per evitare salti di fuso orario nel DatePicker.
    let untilStr = '';
    if (options.until) {
       const d = options.until;
       // Creiamo la stringa YYYY-MM-DD forzando i valori inseriti, ignorando i fusi orari
       untilStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    return {
      isRecurrent: true,
      freq: freqMap[options.freq] || 'WEEKLY',
      interval: String(options.interval || 1),
      until: untilStr
    };
  } catch (e) {
    console.error("Errore nel parsing RRULE:", e);
    return { isRecurrent: true, freq: 'DAILY', interval: '1', until: '' };
  }
};

// 3. Dal Form React a RRULE (Manteniamo il tuo approccio manuale super-sicuro per FastAPI!)
export const buildRRule = (freq: string, interval: string, untilDateStr: string): string => {
  // Siccome le regole base che supporti sono semplici, la tua concatenazione 
  // manuale è perfetta e ci salva dal problema della "Z" di rrule.js
  let str = `FREQ=${freq};INTERVAL=${interval || 1}`;
  
  if (untilDateStr) {
    // Es: "2026-10-15" diventa "20261015T235959" (Formato Naive Locale per FastAPI)
    const cleanDate = untilDateStr.replace(/-/g, ''); 
    str += `;UNTIL=${cleanDate}T235959`; 
  }
  
  return str;
};