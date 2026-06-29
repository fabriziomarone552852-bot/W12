// src/utils/dateUtils.ts

export const nomiMesiLungo = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
];

export const nomiMesiCorto = [
  'Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu',
  'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'
];

export const pad = (num: number) => String(num).padStart(2, '0');

export const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

export const getFirstDayIndex = (year: number, month: number) => {
  let index = new Date(year, month, 1).getDay();
  return index === 0 ? 6 : index - 1; 
};

export const formatDateString = (date: Date) => {
  const yyyy = date.getFullYear();
  // I mesi in JS partono da 0 (Gennaio = 0), quindi aggiungiamo 1
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  
  return `${yyyy}-${mm}-${dd}`;
};

export const getLocalDateString = () => {
  return formatDateString(new Date());
};

export const smontaOrario = (timeStr: string) => {
  if (!timeStr || !timeStr.includes(':')) return { ore: '', minuti: '' };
  const pezzi = timeStr.split(':');
  return { ore: pezzi[0] || '', minuti: pezzi[1] || '' };
};

// Da aggiungere a dateUtils.ts
export const getMondayOfCurrentWeek = (d: Date) => {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
};

export const isSameWeek = (d1: Date, d2: Date) => {
  return getMondayOfCurrentWeek(d1).getTime() === getMondayOfCurrentWeek(d2).getTime();
};

export const isDateInRange = (targetDate: string, startStr?: string, endStr?: string) => {
  if (!startStr) return false;
  const t = new Date(targetDate).getTime();
  const s = new Date(startStr).getTime();
  const e = endStr ? new Date(endStr).getTime() : s;
  return t >= s && t <= e;
};

// Perfetta per i countdown!
export const calculateTimeLeft = (targetDateStr: string) => {
  const now = new Date();
  const target = new Date(targetDateStr);
  const diffMs = target.getTime() - now.getTime();

  if (diffMs <= 0) return { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0, finished: true };

  let y = target.getFullYear() - now.getFullYear();
  let m = target.getMonth() - now.getMonth();
  let d = target.getDate() - now.getDate();
  let h = target.getHours() - now.getHours();
  let min = target.getMinutes() - now.getMinutes();
  let s = target.getSeconds() - now.getSeconds();

  if (s < 0) { s += 60; min--; }
  if (min < 0) { min += 60; h--; }
  if (h < 0) { h += 24; d--; }
  if (d < 0) {
    const prevMonth = new Date(target.getFullYear(), target.getMonth(), 0).getDate();
    d += prevMonth;
    m--;
  }
  if (m < 0) {
    m += 12;
    y--;
  }

  return { years: y, months: m, days: d, hours: h, minutes: min, seconds: s, finished: false };
};

export const calculateYearProgress = () => {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const endOfYear = new Date(now.getFullYear() + 1, 0, 1);
  const elapsed = now.getTime() - startOfYear.getTime();
  const total = endOfYear.getTime() - startOfYear.getTime();
  return Math.floor((elapsed / total) * 100);
};

// --- NUOVE UTILITY SICURE PER I FUSI ORARI ---

/**
 * Combina una data (YYYY-MM-DD) e un orario (HH:MM) costruendo la stringa 
 * manualmente. Questo previene qualsiasi sfasamento UTC (es. 15:30 che diventa 13:30).
 */
export const combineDateAndTime = (dateStr: string, timeStr?: string): string => {
  try {
    const time = timeStr || '00:00';
    
    // Estraiamo i numeri direttamente dalle stringhe dell'utente
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);
    
    // Helper interno per aggiungere lo zero iniziale (es. 9 -> '09')
    const padNum = (n: number) => n.toString().padStart(2, '0');
    
    // Costruiamo il pacchetto perfetto per FastAPI: YYYY-MM-DDTHH:MM:00
    // Niente "Z" finale, niente conversioni matematiche!
    return `${year}-${padNum(month)}-${padNum(day)}T${padNum(hours)}:${padNum(minutes)}:00`;
    
  } catch (e) {
    console.error("Errore nel parsing della data", e);
    // Fallback sicuro al giorno selezionato a mezzanotte
    return `${dateStr}T00:00:00`; 
  }
};

/**
 * Converte una stringa YYYY-MM-DD in DD/MM/YYYY in modo sicuro
 */
export const formatToItalianShortDate = (isoString?: string | null): string => {
  if (!isoString) return '';
  try {
    const datePart = isoString.split('T')[0];
    return datePart.split('-').reverse().join('/');
  } catch (e) {
    return isoString;
  }
};

export const formatTimeToServer = (oraStr?: string): string | null => {
  if (!oraStr || !oraStr.includes(':')) return null;
  
  const [hStr, mStr] = oraStr.split(':');
  const h = parseInt(hStr || '0', 10);
  const m = parseInt(mStr || '0', 10);

  // Preveniamo l'invio di "NaN:NaN" o orari inesistenti (es. 25:99) al backend
  if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
    return null; 
  }

  return `${pad(h)}:${pad(m)}`;
};