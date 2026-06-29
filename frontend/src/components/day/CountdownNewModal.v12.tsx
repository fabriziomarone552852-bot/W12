// src/components/day/CountdownNewModal.tsx
import React, { useState, useEffect } from 'react';
import type { CountdownItem } from './CountdownWidget';

// --- FUNZIONI UTILI PER IL CALENDARIO ---
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

// Smonta l'orario per gestire HH e MM separatamente
const smontaOrario = (timeStr: string) => {
  if (!timeStr || !timeStr.includes(':')) return { ore: '', minuti: '' };
  const pezzi = timeStr.split(':');
  return { ore: pezzi[0] || '', minuti: pezzi[1] || '' };
};

interface CountdownNewModalProps {
  isOpen: boolean;
  onClose: () => void;
  countdownToEdit?: CountdownItem | null;
  onSave: (cd: Partial<CountdownItem>) => void; 
}

const CountdownNewModal: React.FC<CountdownNewModalProps> = ({ isOpen, onClose, countdownToEdit, onSave }) => {
  const [title, setTitle] = useState('');
  const [dateStr, setDateStr] = useState(''); // Formato YYYY-MM-DD
  const [timeStr, setTimeStr] = useState(''); // Formato HH:MM
  const [imageUrl, setImageUrl] = useState('');

  // Stati per il Calendario a comparsa
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [pickerMonthDate, setPickerMonthDate] = useState<Date>(new Date());

  useEffect(() => {
    if (countdownToEdit && isOpen) {
      setTitle(countdownToEdit.title);
      setImageUrl(countdownToEdit.imageUrl);
      
      // Estraiamo data e ora dal formato ISO
      const d = new Date(countdownToEdit.targetDateStr);
      const yyyy = d.getFullYear();
      const mm = pad(d.getMonth() + 1);
      const dd = pad(d.getDate());
      
      setDateStr(`${yyyy}-${mm}-${dd}`);
      setTimeStr(`${pad(d.getHours())}:${pad(d.getMinutes())}`);
      setPickerMonthDate(new Date(yyyy, d.getMonth(), 1));
      
    } else {
      setTitle('');
      setDateStr('');
      setTimeStr('');
      setImageUrl('');
      setPickerMonthDate(new Date());
    }
    setIsDatePickerOpen(false);
  }, [countdownToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dateStr) return;
    
    // Assembliamo data e ora per il salvataggio
    const orarioFinale = timeStr || '00:00';
    // Creiamo la data localmente e la trasformiamo in ISO
    const finalIso = new Date(`${dateStr}T${orarioFinale}:00`).toISOString();

    onSave({
      id: countdownToEdit?.id,
      title,
      targetDateStr: finalIso,
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1506744626753-143283d115a0?q=80&w=800&auto=format&fit=crop'
    });
    onClose();
  };

  const orario分开 = smontaOrario(timeStr);

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-visible transform transition-all animate-fadeIn" onClick={e => e.stopPropagation()}>
        
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
          <h2 className="text-lg font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
             {countdownToEdit ? 'Modifica Countdown' : 'Nuovo Countdown'}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-red-500 bg-white hover:bg-red-50 rounded-md p-1.5 transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* TITOLO */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Titolo Evento</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Es. Esame di Stato, Compleanno..." className="w-full bg-white border border-gray-200 text-gray-800 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 shadow-sm" required />
          </div>

          {/* GRIGLIA DATA E ORA (Ripresa da EventNewModal) */}
          <div className="grid grid-cols-2 gap-4">
            
            {/* Selettore Data */}
            <div className="relative">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Data Scadenza</label>
              <div 
                onClick={() => setIsDatePickerOpen(!isDatePickerOpen)} 
                className="w-full h-[46px] px-3 border border-gray-200 rounded-xl text-sm bg-white cursor-pointer flex justify-between items-center hover:border-blue-500 transition-colors shadow-sm"
              >
                <span className={dateStr ? 'text-gray-700 font-medium' : 'text-gray-400 font-medium'}>
                  {dateStr ? dateStr.split('-').reverse().join('/') : 'Seleziona data'}
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              
              {/* Calendario a comparsa */}
              {isDatePickerOpen && (
                <div className="absolute z-20 top-full mt-2 left-0 bg-white rounded-xl shadow-xl border border-gray-100 p-4 w-64 animate-fadeIn">
                   <div className="flex justify-between items-center mb-4 px-2">
                    <button type="button" onClick={(e) => {e.stopPropagation(); setPickerMonthDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}} className="text-gray-400 hover:text-gray-800 transition-colors"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg></button>
                    <span className="font-bold text-gray-800 text-sm">{nomiMesiLungo[pickerMonthDate.getMonth()]} {pickerMonthDate.getFullYear()}</span>
                    <button type="button" onClick={(e) => {e.stopPropagation(); setPickerMonthDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}} className="text-gray-400 hover:text-gray-800 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg></button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center mb-2">{['L', 'M', 'M', 'G', 'V', 'S', 'D'].map((day, i) => <div key={i} className="text-[10px] font-bold text-gray-400">{day}</div>)}</div>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: getFirstDayIndex(pickerMonthDate.getFullYear(), pickerMonthDate.getMonth()) }).map((_, i) => <div key={`empty-${i}`} className="p-1"></div>)}
                    {Array.from({ length: getDaysInMonth(pickerMonthDate.getFullYear(), pickerMonthDate.getMonth()) }).map((_, i) => {
                      const dayNum = i + 1;
                      const currentLoopDateStr = `${pickerMonthDate.getFullYear()}-${pad(pickerMonthDate.getMonth() + 1)}-${pad(dayNum)}`;
                      const isSelected = dateStr === currentLoopDateStr;
                      return (
                        <button 
                          key={dayNum} 
                          type="button" 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setDateStr(currentLoopDateStr); 
                            setIsDatePickerOpen(false); 
                          }} 
                          className={`w-7 h-7 flex mx-auto items-center justify-center rounded-full text-xs font-medium transition-colors ${isSelected ? 'bg-blue-100 text-blue-700 font-bold' : 'text-gray-700 hover:bg-gray-100'}`}
                        >
                          {dayNum}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Selettore Ora */}
            <div className="relative">
               <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Ora Scadenza</label>
               <div className="relative flex items-center h-[46px] w-full">
                 <div className="w-full h-full flex items-center justify-center gap-1 px-3 border border-gray-200 rounded-xl text-sm bg-white focus-within:border-blue-500 transition-colors shadow-sm">
                   <input
                     type="text" placeholder="HH" maxLength={2} inputMode="numeric"
                     value={orario分开.ore}
                     onChange={(e) => {
                       const val = e.target.value.replace(/\D/g, '');
                       if (val && parseInt(val, 10) > 23) return;
                       setTimeStr(val ? `${val}:${orario分开.minuti || '00'}` : (orario分开.minuti ? `00:${orario分开.minuti}` : ''));
                     }}
                     className="w-8 text-center bg-transparent focus:outline-none text-gray-700 font-medium"
                   />
                   <span className="text-gray-400 font-bold select-none">:</span>
                   <input
                     type="text" placeholder="MM" maxLength={2} inputMode="numeric"
                     value={orario分开.minuti}
                     onChange={(e) => {
                       const val = e.target.value.replace(/\D/g, '');
                       if (val && parseInt(val, 10) > 59) return;
                       setTimeStr(val ? `${orario分开.ore || '00'}:${val}` : (orario分开.ore ? `${orario分开.ore}:00` : ''));
                     }}
                     className="w-8 text-center bg-transparent focus:outline-none text-gray-700 font-medium"
                   />
                 </div>
                 
                 {/* Bottone Cancella Orario */}
                 {timeStr && (
                   <div className="absolute right-2 flex items-center bg-white pl-1 rounded-full">
                     <button type="button" onClick={() => setTimeStr('')} className="text-red-400 hover:text-red-600 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                     </button>
                   </div>
                 )}
               </div>
            </div>
          </div>

          {/* IMMAGINE (URL) */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Sfondo Personalizzato</label>
            <input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="Incolla l'URL dell'immagine..." className="w-full bg-white border border-gray-200 text-gray-800 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 shadow-sm" />
            <p className="text-[10px] text-gray-400 font-medium mt-1.5 ml-1">Se lasciato vuoto, verrà utilizzata un'immagine di default.</p>
          </div>

          <div className="pt-4 mt-6 border-t border-gray-100 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors shadow-sm">Annulla</button>
            <button type="submit" disabled={!dateStr || !title.trim()} className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
              {countdownToEdit ? 'Salva Modifiche' : 'Crea Countdown'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CountdownNewModal;