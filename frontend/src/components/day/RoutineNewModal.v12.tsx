// src/components/day/RoutineNewModal.tsx
import React, { useState, useEffect } from 'react';
import type { RoutineItem } from './RoutineColumn';

// Funzioni utility calendario
const nomiMesiLungo = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
];
const pad = (num: number) => String(num).padStart(2, '0');
const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayIndex = (year: number, month: number) => {
  let index = new Date(year, month, 1).getDay();
  return index === 0 ? 6 : index - 1; 
};
const getLocalDateString = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
};

export interface RoutineSavePayload {
  titolo: string;
  tipo: 'R';
  immagine_url: string;
  rrule: string;
  data_inizio: string;
  target_completamenti: number;
}

interface RoutineNewModalProps {
  isOpen: boolean; 
  onClose: () => void;
  routineToEdit?: RoutineItem | null; 
  onSave: (routineData: RoutineSavePayload) => void; 
}

const RoutineNewModal: React.FC<RoutineNewModalProps> = ({ isOpen, onClose, routineToEdit, onSave }) => {
  const [form, setForm] = useState({
    titolo: '',
    data_inizio: getLocalDateString(),
    immagine_url: '',
    piu_volte: false,
    target_completamenti: 1
  });

  // STATI CALENDARIO DATA INIZIO
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [pickerMonthDate, setPickerMonthDate] = useState<Date>(new Date());

  // STATI RICORRENZA (Forzata a ciclica)
  const [rruleInterval, setRruleInterval] = useState('1');
  const [rruleFreq, setRruleFreq] = useState('DAILY');

  useEffect(() => {
    if (isOpen) {
      if (routineToEdit) {
        setForm({
          titolo: routineToEdit.titolo || '',
          data_inizio: routineToEdit.data_inizio || getLocalDateString(),
          immagine_url: routineToEdit.imageUrl || '',
          piu_volte: routineToEdit.targetCompletions > 1,
          target_completamenti: routineToEdit.targetCompletions || 1
        });
        
        // Parsing base per l'edit del mock
        if (routineToEdit.rrule) {
           if (routineToEdit.rrule.includes('DAILY')) setRruleFreq('DAILY');
           if (routineToEdit.rrule.includes('WEEKLY')) setRruleFreq('WEEKLY');
           if (routineToEdit.rrule.includes('MONTHLY')) setRruleFreq('MONTHLY');
           if (routineToEdit.rrule.includes('YEARLY')) setRruleFreq('YEARLY');
           
           const match = routineToEdit.rrule.match(/INTERVAL=(\d+)/);
           if (match) setRruleInterval(match[1]);
        }

      } else {
        setForm({
          titolo: '',
          data_inizio: getLocalDateString(),
          immagine_url: '',
          piu_volte: false,
          target_completamenti: 1
        });
        setRruleFreq('DAILY');
        setRruleInterval('1');
        setPickerMonthDate(new Date());
      }
    } else {
      setIsDatePickerOpen(false);
    }
  }, [isOpen, routineToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // La regola RRule è sempre attiva per le Routine
    const rruleString = `FREQ=${rruleFreq};INTERVAL=${rruleInterval || 1}`;

    const payload: RoutineSavePayload = {
      titolo: form.titolo,
      tipo: 'R', 
      data_inizio: form.data_inizio,
      immagine_url: form.immagine_url || '',
      target_completamenti: form.target_completamenti,
      rrule: rruleString
    };

    onSave(payload);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-visible transform transition-all animate-fadeIn relative pointer-events-auto flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
          <h3 className="text-lg font-extrabold text-gray-800 uppercase tracking-wider flex items-center gap-2">
            {/* <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg> */}
            {routineToEdit ? 'Modifica Routine' : 'Nuova Routine'}
          </h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* TITOLO */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Nome Routine</label>
            <input type="text" required placeholder="Es. Skincare Serale, Lettura..." value={form.titolo} onChange={(e) => setForm({...form, titolo: e.target.value})} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* DATA INIZIO */}
            <div className="relative">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">A partire dal</label>
              <div onClick={() => setIsDatePickerOpen(!isDatePickerOpen)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white cursor-pointer flex justify-between items-center hover:border-blue-500 transition-colors shadow-sm">
                <span className={form.data_inizio ? 'text-gray-700 font-bold' : 'text-gray-400'}>{form.data_inizio ? form.data_inizio.split('-').reverse().join('/') : 'Oggi'}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              {isDatePickerOpen && (
                <div className="absolute z-20 top-full mt-2 left-0 bg-white rounded-xl shadow-xl border border-gray-100 p-4 w-64 animate-fadeIn">
                   <div className="flex justify-between items-center mb-4 px-2">
                    <button type="button" onClick={() => setPickerMonthDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))} className="text-gray-400 hover:text-gray-800 transition-colors"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg></button>
                    <span className="font-bold text-gray-800 text-sm">{nomiMesiLungo[pickerMonthDate.getMonth()]} {pickerMonthDate.getFullYear()}</span>
                    <button type="button" onClick={() => setPickerMonthDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))} className="text-gray-400 hover:text-gray-800 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg></button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center mb-2">{['L', 'M', 'M', 'G', 'V', 'S', 'D'].map((day, i) => <div key={i} className="text-[10px] font-bold text-gray-400">{day}</div>)}</div>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: getFirstDayIndex(pickerMonthDate.getFullYear(), pickerMonthDate.getMonth()) }).map((_, i) => <div key={`empty-${i}`} className="p-1"></div>)}
                    {Array.from({ length: getDaysInMonth(pickerMonthDate.getFullYear(), pickerMonthDate.getMonth()) }).map((_, i) => {
                      const dayNum = i + 1;
                      const dateStr = `${pickerMonthDate.getFullYear()}-${pad(pickerMonthDate.getMonth() + 1)}-${pad(dayNum)}`;
                      const isSelected = form.data_inizio === dateStr;
                      return (
                        <button key={dayNum} type="button" onClick={() => { setForm({...form, data_inizio: dateStr}); setIsDatePickerOpen(false); }} className={`w-7 h-7 flex mx-auto items-center justify-center rounded-full text-xs font-medium transition-colors ${isSelected ? 'bg-blue-100 text-blue-700 font-bold' : 'text-gray-700 hover:bg-gray-100'}`}>{dayNum}</button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* FREQUENZA (Senza toggle, solo selezione) */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Ripeti ogni</label>
              <div className="flex border border-gray-200 rounded-xl shadow-sm h-[42px] overflow-hidden focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                <input 
                  type="number" min="1" 
                  value={rruleInterval} 
                  onChange={e => setRruleInterval(e.target.value)}
                  className="w-14 px-2 py-1.5 border-r border-gray-200 text-center focus:outline-none font-bold text-gray-800 bg-gray-50"
                />
                <select 
                  value={rruleFreq}
                  onChange={e => setRruleFreq(e.target.value)}
                  className="flex-1 px-2 py-1.5 focus:outline-none bg-white font-bold text-gray-800 cursor-pointer text-sm"
                >
                  <option value="DAILY">{parseInt(rruleInterval) > 1 ? 'giorni' : 'giorno'}</option>
                  <option value="WEEKLY">{parseInt(rruleInterval) > 1 ? 'settimane' : 'settimana'}</option>
                  <option value="MONTHLY">{parseInt(rruleInterval) > 1 ? 'mesi' : 'mese'}</option>
                  <option value="YEARLY">{parseInt(rruleInterval) > 1 ? 'anni' : 'anno'}</option>
                </select>
              </div>
            </div>
          </div>

          {/* TARGET COMPLETAMENTI */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <input 
                type="checkbox" 
                id="multiToggle"
                checked={form.piu_volte}
                onChange={(e) => setForm({...form, piu_volte: e.target.checked, target_completamenti: e.target.checked ? 2 : 1})}
                className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="multiToggle" className="text-sm font-bold text-gray-800 cursor-pointer select-none">
                Va completata più volte in una giornata
              </label>
            </div>
            
            {form.piu_volte && (
              <div className="flex items-center justify-between mt-4 pl-8 animate-fadeIn">
                 <span className="text-sm font-medium text-gray-600">Volte al giorno:</span>
                 <div className="flex items-center bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                    <button type="button" onClick={() => setForm({...form, target_completamenti: Math.max(2, form.target_completamenti - 1)})} className="px-4 py-1.5 text-gray-500 hover:bg-gray-100 hover:text-red-500 font-black transition-colors">-</button>
                    <span className="px-4 py-1.5 font-bold text-gray-800 border-x border-gray-100 min-w-[3rem] text-center">{form.target_completamenti}</span>
                    <button type="button" onClick={() => setForm({...form, target_completamenti: form.target_completamenti + 1})} className="px-4 py-1.5 text-gray-500 hover:bg-gray-100 hover:text-green-500 font-black transition-colors">+</button>
                 </div>
              </div>
            )}
          </div>

          {/* IMMAGINE */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Immagine di Sfondo (URL)</label>
            <input type="url" value={form.immagine_url} onChange={e => setForm({...form, immagine_url: e.target.value})} placeholder="Incolla l'URL di un'immagine..." className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm" />
            <p className="text-[10px] text-gray-400 font-medium mt-1.5 ml-1">Verrà usata per decorare la card.</p>
          </div>

          {/* PULSANTI */}
          <div className="pt-2 border-t border-gray-100 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors shadow-sm">Annulla</button>
            <button type="submit" disabled={!form.titolo.trim()} className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
              {routineToEdit ? 'Aggiorna' : 'Crea Routine'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default RoutineNewModal;