// src/components/dashboard/NewEventModal.tsx
import React, { useState, useEffect } from 'react';
import { apiUrl } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

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

interface NewEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  dbCategories: any[];
  onCategoryAdded: (newCategory: any) => void;
  eventToEdit?: any | null;
  onEventSaved: () => void; 
}

const NewEventModal: React.FC<NewEventModalProps> = ({ isOpen, onClose, dbCategories, onCategoryAdded, eventToEdit, onEventSaved }) => {
  const { token } = useAuth();

  const [newEventForm, setNewEventForm] = useState({
    titolo: '',
    descrizione: '',
    data_inizio: new Date().toISOString().slice(0, 10),
    data_fine: '',
    ora_inizio: '',
    ora_fine: '',
    category: '',
    luogo: '',
    tutto_il_giorno: false
  });

  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isEndDatePickerOpen, setIsEndDatePickerOpen] = useState(false);
  const [pickerMonthDate, setPickerMonthDate] = useState<Date>(new Date());
  const [endPickerMonthDate, setEndPickerMonthDate] = useState<Date>(new Date());
  
  const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
  const [rruleFreq, setRruleFreq] = useState(''); 
  const [rruleUntil, setRruleUntil] = useState('');
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [newCategoryForm, setNewCategoryForm] = useState({ name: '', colore: '#3B82F6' });

  const eventCategories = dbCategories.filter(cat => cat.genre === 2 || cat.genre === 3);

  useEffect(() => {
    if (isOpen) {
      if (eventToEdit) {
        let freq = '';
        let until = '';
        if (eventToEdit.rrule) {
          if (eventToEdit.rrule.includes('DAILY')) freq = 'DAILY';
          if (eventToEdit.rrule.includes('WEEKLY')) freq = 'WEEKLY';
          if (eventToEdit.rrule.includes('MONTHLY')) freq = 'MONTHLY';
          
          const match = eventToEdit.rrule.match(/UNTIL=(\d{4})(\d{2})(\d{2})/);
          if (match) until = `${match[1]}-${match[2]}-${match[3]}`;
        }
        setRruleFreq(freq);
        setRruleUntil(until);

        setNewEventForm({
          titolo: eventToEdit.title || '',
          descrizione: eventToEdit.description || '',
          data_inizio: eventToEdit.dateStr || new Date().toISOString().slice(0, 10),
          data_fine: eventToEdit.endDateStr || '',
          ora_inizio: eventToEdit.time || '',
          ora_fine: eventToEdit.endTime || '',
          category: eventToEdit.category || '',
          luogo: eventToEdit.location || '',
          tutto_il_giorno: !eventToEdit.time && !eventToEdit.endTime
        });
      } else {
        setRruleFreq('');
        setRruleUntil('');
        setNewEventForm({
          titolo: '', descrizione: '', data_inizio: new Date().toISOString().slice(0, 10),
          data_fine: '', ora_inizio: '', ora_fine: '', category: '', luogo: '', tutto_il_giorno: false
        });
      }
    } else {
      setIsNewCategoryModalOpen(false);
      setIsCategoryDropdownOpen(false);
      setIsDatePickerOpen(false);
      setIsEndDatePickerOpen(false);
      setAlertMessage(null); 
    }
  }, [isOpen, eventToEdit]);

  // Funzione di utilità per estrarre ore e minuti separati dalla stringa del modulo
  const smontaOrario = (timeStr: string) => {
    if (!timeStr || !timeStr.includes(':')) return { ore: '', minuti: '' };
    const pezzi = timeStr.split(':');
    return { ore: pezzi[0] || '', minuti: pezzi[1] || '' };
  };

  const handleSaveCategory = async () => {
    const nomePulito = newCategoryForm.name.trim();
    if (!nomePulito) return; 

    const esisteGia = dbCategories.some((cat: any) => cat.name.toLowerCase() === nomePulito.toLowerCase());
    if (esisteGia) {
      setAlertMessage("Questa categoria è già presente nel database. Scegli un nome diverso!");
      return; 
    }

    try {
      const res = await fetch(apiUrl('/categories'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: nomePulito, colore: newCategoryForm.colore, genre: 2 })
      });
      if (res.ok) {
        const nuovaCat = await res.json();
        onCategoryAdded(nuovaCat); 
        setIsNewCategoryModalOpen(false);
        setNewCategoryForm({ name: '', colore: '#3B82F6' });
      }
    } catch (err) {
      console.error("Errore salvataggio categoria", err);
    }
  };

const handleSalvaNuovoEvento = async (e: React.FormEvent) => {
    e.preventDefault();
    const categoriaScelta = dbCategories.find(c => c.name === newEventForm.category);
    const categoryId = categoriaScelta ? Number(categoriaScelta.id) : null;

    const formattaPerServer = (oraStr: string) => {
      if (!oraStr || !oraStr.includes(':')) return null;
      const [h, m] = oraStr.split(':');
      if (!h && !m) return null;
      return `${pad(parseInt(h || '0', 10))}:${pad(parseInt(m || '0', 10))}`;
    };

        const oraInizioPronta = formattaPerServer(newEventForm.ora_inizio);
        const oraFinePronta = formattaPerServer(newEventForm.ora_fine);

        const èTuttoIlGiorno = newEventForm.tutto_il_giorno || (!oraInizioPronta && !oraFinePronta);

        // IL TRUCCO: Se lasci vuoto l'inizio ma metti la fine, usiamo la fine per entrambi!
        let oraInizioFinale = oraInizioPronta;
        if (!oraInizioPronta && oraFinePronta) {
        oraInizioFinale = oraFinePronta;
        }

        const dataInizioStr = oraInizioFinale 
        ? `${newEventForm.data_inizio}T${oraInizioFinale}:00` 
        : `${newEventForm.data_inizio}T00:00:00`;
        
        let dataFineStr = null;
        if (newEventForm.data_fine) {
        dataFineStr = oraFinePronta
            ? `${newEventForm.data_fine}T${oraFinePronta}:00`
            : `${newEventForm.data_fine}T23:59:59`;
        } else if (oraFinePronta) {
        dataFineStr = `${newEventForm.data_inizio}T${oraFinePronta}:00`;
    }

    let rruleString = null;
    if (rruleFreq) {
      rruleString = `FREQ=${rruleFreq}`;
      // Se abbiamo messo un limite, uniamo l'UNTIL formattandolo senza i trattini
      if (rruleUntil) {
        const dataPulita = rruleUntil.replace(/-/g, ''); 
        rruleString += `;UNTIL=${dataPulita}T235959`;
      }
    }

    const pacchettoPerIlServer = {
      titolo: newEventForm.titolo,
      descrizione: newEventForm.descrizione || null,
      data_inizio: dataInizioStr,
      data_fine: dataFineStr,
      tutto_il_giorno: èTuttoIlGiorno, // Invia il valore corretto al server
      category_id: categoryId,
      luogo: newEventForm.luogo || null,
      rrule: rruleString,
    };

    try {
      // Puliamo l'ID anche qui prima di chiedere al server di aggiornarlo
      const veroId = eventToEdit ? String(eventToEdit.id).split('-')[0] : null;
      const endpoint = eventToEdit ? `/events/${veroId}` : '/events';
      const method = eventToEdit ? 'PATCH' : 'POST';

      const res = await fetch(apiUrl(endpoint), {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(pacchettoPerIlServer)
      });

      if (res.ok) {
        onEventSaved();
        onClose();
      } else {
         console.error("Errore risposta server", await res.text());
      }
    } catch (errore) {
      console.error("Errore nel salvataggio dell'evento", errore);
    }
  };

  const orarioInizio分开 = smontaOrario(newEventForm.ora_inizio);
  const orarioFine分开 = smontaOrario(newEventForm.ora_fine);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      
      {/* AVVISO CENTRALE GENERICO */}
      {alertMessage && (
        <div 
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center z-[80] p-4 pointer-events-auto"
          onClick={(e) => { e.stopPropagation(); setAlertMessage(null); }}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center animate-fadeIn transform transition-all scale-100"
            onClick={(e) => e.stopPropagation()} 
          >
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-extrabold text-gray-900 mb-2">Attenzione</h3>
            <p className="text-sm text-gray-600 mb-6">{alertMessage}</p>
            <button 
              type="button"
              onClick={() => setAlertMessage(null)} 
              className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold text-sm transition-colors"
            >
              Ho capito
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-4 items-start w-full max-w-5xl justify-center pointer-events-none" onClick={(e) => e.stopPropagation()}>
        
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-visible transform transition-all animate-fadeIn relative pointer-events-auto flex-shrink-0">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
            <h3 className="text-lg font-extrabold text-gray-800 uppercase tracking-wider">
              {eventToEdit ? 'Modifica Evento' : 'Nuovo Evento'}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <form onSubmit={handleSalvaNuovoEvento} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Titolo Evento</label>
              <input type="text" required placeholder="Es. Visita Medica, Riunione..." value={newEventForm.titolo} onChange={(e) => setNewEventForm({...newEventForm, titolo: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descrizione</label>
              <textarea placeholder="Aggiungi dettagli..." value={newEventForm.descrizione} onChange={(e) => setNewEventForm({...newEventForm, descrizione: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 h-20 resize-none" />
            </div>

            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="allDayToggle"
                  checked={newEventForm.tutto_il_giorno}
                  onChange={(e) => setNewEventForm({...newEventForm, tutto_il_giorno: e.target.checked, ora_inizio: '', ora_fine: ''})}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="allDayToggle" className="text-sm font-bold text-gray-700 cursor-pointer select-none">
                  Tutto il giorno
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Data Inizio</label>
                <div onClick={() => { setIsDatePickerOpen(!isDatePickerOpen); setIsEndDatePickerOpen(false); setIsCategoryDropdownOpen(false); }} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white cursor-pointer flex justify-between items-center hover:border-blue-500 transition-colors">
                  <span className={newEventForm.data_inizio ? 'text-gray-700' : 'text-gray-400'}>{newEventForm.data_inizio ? newEventForm.data_inizio.split('-').reverse().join('/') : 'Seleziona data'}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                {isDatePickerOpen && (
                  <div className="absolute z-20 bottom-full mb-2 left-0 bg-white rounded-xl shadow-xl border border-gray-100 p-4 w-64 animate-fadeIn">
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
                        const isSelected = newEventForm.data_inizio === dateStr;
                        return (
                          <button key={dayNum} type="button" onClick={() => { setNewEventForm({...newEventForm, data_inizio: dateStr}); setIsDatePickerOpen(false); }} className={`w-7 h-7 flex mx-auto items-center justify-center rounded-full text-xs font-medium transition-colors ${isSelected ? 'bg-blue-100 text-blue-700 font-bold' : 'text-gray-700 hover:bg-gray-100'}`}>{dayNum}</button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ora Inizio</label>
                 <div className="relative flex items-center">
                   {/* Caselle di testo */}
                   <div className={`w-full flex items-center justify-center gap-1 px-3 py-1.5 border border-gray-200 rounded-xl text-sm bg-white focus-within:border-blue-500 transition-colors ${newEventForm.tutto_il_giorno ? 'bg-gray-100' : ''}`}>
                     <input
                       type="text" placeholder="HH" maxLength={2} inputMode="numeric" disabled={newEventForm.tutto_il_giorno}
                       value={orarioInizio分开.ore}
                       onChange={(e) => {
                         const val = e.target.value.replace(/\D/g, '');
                         if (val && parseInt(val, 10) > 23) return;
                         setNewEventForm({...newEventForm, ora_inizio: val ? `${val}:${orarioInizio分开.minuti || '00'}` : (orarioInizio分开.minuti ? `00:${orarioInizio分开.minuti}` : '') });
                       }}
                       className="w-6 text-center bg-transparent focus:outline-none text-gray-700 font-medium disabled:text-gray-400"
                     />
                     <span className="text-gray-400 font-bold select-none">:</span>
                     <input
                       type="text" placeholder="MM" maxLength={2} inputMode="numeric" disabled={newEventForm.tutto_il_giorno}
                       value={orarioInizio分开.minuti}
                       onChange={(e) => {
                         const val = e.target.value.replace(/\D/g, '');
                         if (val && parseInt(val, 10) > 59) return;
                         setNewEventForm({...newEventForm, ora_inizio: val ? `${orarioInizio分开.ore || '00'}:${val}` : (orarioInizio分开.ore ? `${orarioInizio分开.ore}:00` : '') });
                       }}
                       className="w-6 text-center bg-transparent focus:outline-none text-gray-700 font-medium disabled:text-gray-400"
                     />
                   </div>
                   
                   {/* Tasto "X" per svuotare */}
                   {newEventForm.ora_inizio && !newEventForm.tutto_il_giorno && (
                     <div className="absolute right-2 flex items-center bg-white pl-1 rounded-full">
                       <button type="button" onClick={() => setNewEventForm({...newEventForm, ora_inizio: ''})} className="text-red-400 hover:text-red-600 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                       </button>
                     </div>
                   )}
                 </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Data Fine</label>
                <div className="relative flex items-center">
                  <div onClick={() => { setIsEndDatePickerOpen(!isEndDatePickerOpen); setIsDatePickerOpen(false); setIsCategoryDropdownOpen(false); }} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white cursor-pointer flex justify-between items-center hover:border-blue-500 transition-colors">
                    <span className={newEventForm.data_fine ? 'text-gray-700' : 'text-gray-400'}>{newEventForm.data_fine ? newEventForm.data_fine.split('-').reverse().join('/') : 'Stesso giorno'}</span>
                  </div>
                  <div className="absolute right-3 flex items-center">
                    {newEventForm.data_fine ? (
                      <button type="button" onClick={(e) => { e.stopPropagation(); setNewEventForm({...newEventForm, data_fine: ''}); }} className="text-red-400 hover:text-red-600 bg-white rounded-full transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                      </button>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    )}
                  </div>
                </div>
                {isEndDatePickerOpen && (
                  <div className="absolute z-20 bottom-full mb-2 left-0 bg-white rounded-xl shadow-xl border border-gray-100 p-4 w-64 animate-fadeIn">
                     <div className="flex justify-between items-center mb-4 px-2">
                      <button type="button" onClick={() => setEndPickerMonthDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))} className="text-gray-400 hover:text-gray-800 transition-colors"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg></button>
                      <span className="font-bold text-gray-800 text-sm">{nomiMesiLungo[endPickerMonthDate.getMonth()]} {endPickerMonthDate.getFullYear()}</span>
                      <button type="button" onClick={() => setEndPickerMonthDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))} className="text-gray-400 hover:text-gray-800 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg></button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center mb-2">{['L', 'M', 'M', 'G', 'V', 'S', 'D'].map((day, i) => <div key={i} className="text-[10px] font-bold text-gray-400">{day}</div>)}</div>
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: getFirstDayIndex(endPickerMonthDate.getFullYear(), endPickerMonthDate.getMonth()) }).map((_, i) => <div key={`empty-${i}`} className="p-1"></div>)}
                      {Array.from({ length: getDaysInMonth(endPickerMonthDate.getFullYear(), endPickerMonthDate.getMonth()) }).map((_, i) => {
                        const dayNum = i + 1;
                        const dateStr = `${endPickerMonthDate.getFullYear()}-${pad(endPickerMonthDate.getMonth() + 1)}-${pad(dayNum)}`;
                        const isSelected = newEventForm.data_fine === dateStr;
                        return (
                          <button key={dayNum} type="button" onClick={() => { setNewEventForm({...newEventForm, data_fine: dateStr}); setIsEndDatePickerOpen(false); }} className={`w-7 h-7 flex mx-auto items-center justify-center rounded-full text-xs font-medium transition-colors ${isSelected ? 'bg-blue-100 text-blue-700 font-bold' : 'text-gray-700 hover:bg-gray-100'}`}>{dayNum}</button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ora Fine</label>
                 <div className="relative flex items-center">
                   {/* Caselle di testo */}
                   <div className={`w-full flex items-center justify-center gap-1 px-3 py-1.5 border border-gray-200 rounded-xl text-sm bg-white focus-within:border-blue-500 transition-colors ${newEventForm.tutto_il_giorno ? 'bg-gray-100' : ''}`}>
                     <input
                       type="text" placeholder="HH" maxLength={2} inputMode="numeric" disabled={newEventForm.tutto_il_giorno}
                       value={orarioFine分开.ore}
                       onChange={(e) => {
                         const val = e.target.value.replace(/\D/g, '');
                         if (val && parseInt(val, 10) > 23) return;
                         setNewEventForm({...newEventForm, ora_fine: val ? `${val}:${orarioFine分开.minuti || '00'}` : (orarioFine分开.minuti ? `00:${orarioFine分开.minuti}` : '') });
                       }}
                       className="w-6 text-center bg-transparent focus:outline-none text-gray-700 font-medium disabled:text-gray-400"
                     />
                     <span className="text-gray-400 font-bold select-none">:</span>
                     <input
                       type="text" placeholder="MM" maxLength={2} inputMode="numeric" disabled={newEventForm.tutto_il_giorno}
                       value={orarioFine分开.minuti}
                       onChange={(e) => {
                         const val = e.target.value.replace(/\D/g, '');
                         if (val && parseInt(val, 10) > 59) return;
                         setNewEventForm({...newEventForm, ora_fine: val ? `${orarioFine分开.ore || '00'}:${val}` : (orarioFine分开.ore ? `${orarioFine分开.ore}:00` : '') });
                       }}
                       className="w-6 text-center bg-transparent focus:outline-none text-gray-700 font-medium disabled:text-gray-400"
                     />
                   </div>

                   {/* Tasto "X" per svuotare */}
                   {newEventForm.ora_fine && !newEventForm.tutto_il_giorno && (
                     <div className="absolute right-2 flex items-center bg-white pl-1 rounded-full">
                       <button type="button" onClick={() => setNewEventForm({...newEventForm, ora_fine: ''})} className="text-red-400 hover:text-red-600 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                          </button>
                     </div>
                   )}
                 </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Categoria</label>
                  <button type="button" onClick={() => setIsNewCategoryModalOpen(!isNewCategoryModalOpen)} className="hover:bg-blue-100 text-gray-500 hover:text-blue-500 rounded p-0.5 transition-colors" title={isNewCategoryModalOpen ? "Chiudi" : "Crea nuova categoria"}><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg></button>
                </div>
                <div onClick={() => { setIsCategoryDropdownOpen(!isCategoryDropdownOpen); setIsDatePickerOpen(false); setIsEndDatePickerOpen(false); }} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white cursor-pointer flex justify-between items-center hover:border-blue-500 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: eventCategories.find(c => c.name === newEventForm.category)?.colore || '#9CA3AF' }}></span>
                    <span className="text-gray-700 truncate">{newEventForm.category || 'Seleziona...'}</span>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-gray-400 transition-transform shrink-0 ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
                {isCategoryDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl py-1 animate-fadeIn max-h-48 overflow-y-auto">
                    {eventCategories.map(cat => (
                      <div key={cat.id} onClick={() => { setNewEventForm({...newEventForm, category: cat.name}); setIsCategoryDropdownOpen(false); }} className="px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer flex items-center gap-2 transition-colors">
                        <span className="w-3 h-3 rounded-full border border-gray-200 shrink-0" style={{ backgroundColor: cat.colore || '#9CA3AF' }}></span>
                        <span className="text-gray-700 truncate">{cat.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Luogo</label>
                <input type="text" placeholder="Es. Ufficio, Roma..." value={newEventForm.luogo} onChange={(e) => setNewEventForm({...newEventForm, luogo: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
              </div>
            </div>

            {/* SEZIONE RIPETIZIONE */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ripetizione</label>
                <select
                  value={rruleFreq}
                  onChange={(e) => {
                    setRruleFreq(e.target.value);
                    if (!e.target.value) setRruleUntil(''); // Pulisce la data se togli la ripetizione
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-white"
                >
                  <option value="">Non si ripete</option>
                  <option value="DAILY">Ogni giorno</option>
                  <option value="WEEKLY">Ogni settimana</option>
                  <option value="MONTHLY">Ogni mese</option>
                </select>
              </div>

              {rruleFreq && (
                <div className="animate-fadeIn">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 text-blue-500">
                    Fino al (Opzionale)
                  </label>
                  <input
                    type="date"
                    min={newEventForm.data_inizio}
                    value={rruleUntil}
                    onChange={(e) => setRruleUntil(e.target.value)}
                    className="w-full px-3 py-2 border border-blue-200 bg-blue-50 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-gray-700"
                  />
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100 flex gap-3">
              <button type="button" onClick={onClose} className="flex-1 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg font-bold text-sm hover:bg-gray-100 transition-colors">Annulla</button>
              <button type="submit" className="flex-1 py-2 rounded-lg font-bold text-sm text-white bg-blue-500 hover:bg-blue-600 transition-colors">
                {eventToEdit ? 'Aggiorna Evento' : 'Salva Evento'}
              </button>
            </div>
          </form>
        </div>

        {isNewCategoryModalOpen && (
          <div className="w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-fadeIn pointer-events-auto flex-shrink-0">
            <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h4 className="text-sm font-extrabold text-gray-800 uppercase tracking-wider">Crea Categoria</h4>
              <button type="button" onClick={() => setIsNewCategoryModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome</label>
                <input type="text" placeholder="Es. Appuntamenti..." value={newCategoryForm.name} onChange={(e) => setNewCategoryForm({...newCategoryForm, name: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Colore (HEX)</label>
                <div className="flex gap-2">
                  <input type="color" value={newCategoryForm.colore} onChange={(e) => setNewCategoryForm({...newCategoryForm, colore: e.target.value})} className="w-10 h-10 p-0.5 border border-gray-200 rounded-lg cursor-pointer" />
                  <input type="text" value={newCategoryForm.colore} onChange={(e) => setNewCategoryForm({...newCategoryForm, colore: e.target.value})} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 uppercase" />
                </div>
              </div>
              <button type="button" onClick={handleSaveCategory} className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold text-sm transition-colors">Salva nel Database</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewEventModal;