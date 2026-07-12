// src/utils/dateUtils.ts
import { 
  getDaysInMonth as dfGetDaysInMonth,
  startOfWeek, 
  isSameWeek as dfIsSameWeek,
  intervalToDuration,
  isBefore
} from 'date-fns';

export const nomiMesiLungo = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
];

export const nomiMesiCorto = [
  'Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu',
  'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'
];

export const pad = (num: number) => String(num).padStart(2, '0');

// --- 1. MATEMATICA DEI CALENDARI (Migliorata con date-fns) ---

export const getDaysInMonth = (year: number, month: number) => dfGetDaysInMonth(new Date(year, month));

export const getFirstDayIndex = (year: number, month: number) => {
  let index = new Date(year, month, 1).getDay();
  return index === 0 ? 6 : index - 1; 
};

export const getMondayOfCurrentWeek = (d: Date) => startOfWeek(d, { weekStartsOn: 1 });

export const isSameWeek = (d1: Date, d2: Date) => dfIsSameWeek(d1, d2, { weekStartsOn: 1 });

export const isDateInRange = (targetDate: string, startStr?: string, endStr?: string) => {
  if (!startStr) return false;
  const t = new Date(targetDate).getTime();
  const s = new Date(startStr).getTime();
  const e = endStr ? new Date(endStr).getTime() : s;
  return t >= s && t <= e;
};

// --- 2. GESTIONE COUNTDOWN (Il vero capolavoro di date-fns) ---

export const calculateTimeLeft = (targetDateStr: string) => {
  const now = new Date();
  const target = new Date(targetDateStr);

  if (isBefore(target, now)) {
    return { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0, finished: true };
  }

  // intervalToDuration fa tutto da solo, gestendo anni bisestili e mesi dispari!
  const duration = intervalToDuration({ start: now, end: target });

  return { 
    years: duration.years || 0, 
    months: duration.months || 0, 
    days: duration.days || 0, 
    hours: duration.hours || 0, 
    minutes: duration.minutes || 0, 
    seconds: duration.seconds || 0, 
    finished: false 
  };
};

export const calculateYearProgress = () => {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const endOfYear = new Date(now.getFullYear() + 1, 0, 1);
  const elapsed = now.getTime() - startOfYear.getTime();
  const total = endOfYear.getTime() - startOfYear.getTime();
  return Math.floor((elapsed / total) * 100);
};

// --- 3. FORMATTAZIONE E COMUNICAZIONE CON FASTAPI (Mantenuta manuale per sicurezza) ---

export const formatDateString = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const getLocalDateString = () => formatDateString(new Date());

export const smontaOrario = (timeStr: string) => {
  if (!timeStr || !timeStr.includes(':')) return { ore: '', minuti: '' };
  const pezzi = timeStr.split(':');
  return { ore: pezzi[0] || '', minuti: pezzi[1] || '' };
};

export const combineDateAndTime = (dateStr: string, timeStr?: string): string => {
  try {
    const time = timeStr || '00:00';
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);
    
    // Niente .toISOString() ! Costruiamo il naive datetime per FastAPI
    return `${year}-${pad(month)}-${pad(day)}T${pad(hours)}:${pad(minutes)}:00`;
  } catch (e) {
    console.error("Errore nel parsing della data", e);
    return `${dateStr}T00:00:00`; 
  }
};

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

  if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
    return null; 
  }
  return `${pad(h)}:${pad(m)}`;

};

export const getMonday = (d: Date): Date => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
};

export const getSunday = (d: Date): Date => {
  const monday = getMonday(d);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return sunday;
};

export const getISOWeekNumber = (d: Date): number => {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

export const getLocalTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  export const generateWeeksGrid = (
  firstDayIdx: number, 
  daysInMo: number
): (number | null)[][] => {
  const cells: (number | null)[] = [
    ...Array(firstDayIdx).fill(null),
    ...Array.from({ length: daysInMo }, (_, i) => i + 1)
  ];
  
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }
  
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  
  return weeks;
};


//  Genera le etichette per l'header della pagina (es. "OGGI", "12 ottobre 2023")

export const getAgendaDateLabels = (targetDate: Date) => {
  const isToday = new Date().toDateString() === targetDate.toDateString();
  const displayName = isToday 
    ? "OGGI" 
    : targetDate.toLocaleDateString('it-IT', { weekday: 'long' }).toUpperCase();
  const formattedDate = targetDate.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });

  return { isToday, displayName, formattedDate };
};