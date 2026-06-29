// src/components/dashboard/EventNewModal.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { type Category, CategoryGenre } from '../../types';
import type { CalendarEvent } from '../dashboard/CalendarColumn';
import DatePicker from './utils/DatePicker'; 
import { getLocalDateString, smontaOrario, pad, formatTimeToServer } from '../../utils/dateUtils'; 
import CategorySelect from '../shared/utils/CategorySelect';
import BaseModal from '../shared/dialog/BaseModal';
import { useConfirm } from '../../context/ConfirmContext';
import { CancelIcon } from '../shared/utils/Icons';
import { combineDateAndTime } from '../../utils/dateUtils';
import { parseRRule, buildRRule } from '../../utils/rruleUtils';
import { RecurrenceEditor } from './utils/RecurrenceEditor';
import { useCategories } from '../../hooks/useCategories';
import { useAgendaMutations } from '../../hooks/useAgendaMutations';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '../../hooks/useApi';

interface NewEventModalProps {
  isOpen: boolean; 
  onClose: () => void;
  eventToEdit?: CalendarEvent | null;
  onEventSaved?: () => void; 
  initialDate?: string | null;
}

const NewEventModal: React.FC<NewEventModalProps> = ({ 
  isOpen, onClose, eventToEdit, initialDate, onEventSaved
}) => {
  const { token } = useAuth();
  const { addEvent, updateEvent } = useAgendaMutations();
  const { dbCategories } = useCategories();

  const [newEventForm, setNewEventForm] = useState({
    titolo: '', descrizione: '', data_inizio: getLocalDateString(), 
    data_fine: '', ora_inizio: '', ora_fine: '', category: '', luogo: '', tutto_il_giorno: false
  });

  const {confirm} = useConfirm();

  // Gestione calendari a comparsa (il nostro DatePicker)
  const [activeDatePicker, setActiveDatePicker] = useState<'start' | 'end' | 'until' | null>(null);

  // Gestione ricorrenze
  const [isRecurrent, setIsRecurrent] = useState(false);
  const [rruleInterval, setRruleInterval] = useState('1');
  const [rruleFreq, setRruleFreq] = useState('WEEKLY');
  const [rruleUntil, setRruleUntil] = useState('');

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (eventToEdit) {
        setNewEventForm({
          titolo: eventToEdit.title || '',
          descrizione: eventToEdit.description || '',
          data_inizio: eventToEdit.dateStr || getLocalDateString(),
          data_fine: eventToEdit.endDateStr || '',
          ora_inizio: eventToEdit.time || '',
          ora_fine: eventToEdit.endTime || '',
          category: eventToEdit.category || '',
          luogo: eventToEdit.location || '',
          tutto_il_giorno: !!eventToEdit.tutto_il_giorno
        });

        // 🪄 MAGIA 1: Una singola riga sostituisce le espressioni regolari!
        const { isRecurrent: isRec, freq, interval, until } = parseRRule(eventToEdit.rrule);
        setIsRecurrent(isRec);
        setRruleFreq(freq);
        setRruleInterval(interval);
        setRruleUntil(until);

      } else {
        setNewEventForm({
          titolo: '', descrizione: '', data_inizio: initialDate || getLocalDateString(),
          data_fine: '', ora_inizio: '', ora_fine: '', category: '', luogo: '', tutto_il_giorno: false
        });
        setIsRecurrent(false);
        setRruleFreq('WEEKLY');
        setRruleInterval('1');
        setRruleUntil('');
      }
    } else {
      setActiveDatePicker(null);
    }
  }, [isOpen, eventToEdit, initialDate]);

  const handleSalvaNuovoEvento = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // 1. OTTIMA UX: Accendiamo il caricamento
  setIsSaving(true); 

  const categoriaScelta = dbCategories.find((c: Category) => c.name === newEventForm.category);
  const categoryId = categoriaScelta ? Number(categoriaScelta.id) : undefined;

  // 2. OTTIMA ARCHITETTURA: Usiamo le utility esterne pulite
  const oraInizioPronta = formatTimeToServer(newEventForm.ora_inizio);
  const oraFinePronta = formatTimeToServer(newEventForm.ora_fine);

  const èTuttoIlGiorno = newEventForm.tutto_il_giorno || (!oraInizioPronta && !oraFinePronta);

  let oraInizioFinale = oraInizioPronta;
  if (!oraInizioPronta && oraFinePronta) oraInizioFinale = oraFinePronta;

  // 3. MASSIMA SICUREZZA: Usiamo combineDateAndTime per evitare bug di fuso orario
  const dataInizioStr = combineDateAndTime(newEventForm.data_inizio, oraInizioFinale || '00:00');
  
  let dataFineStr = null;
  if (newEventForm.data_fine) {
    dataFineStr = combineDateAndTime(newEventForm.data_fine, oraFinePronta || '23:59');
  } else if (oraFinePronta) {
    dataFineStr = combineDateAndTime(newEventForm.data_inizio, oraFinePronta);
  }

  // 4. OTTIMA ARCHITETTURA: Generiamo la regola ricorrente tramite utility
  let rruleString = null;
  if (isRecurrent) {
    rruleString = buildRRule(rruleFreq, rruleInterval, rruleUntil);
  }

  const pacchettoPerIlServer = {
    titolo: newEventForm.titolo,
    descrizione: newEventForm.descrizione || null,
    data_inizio: dataInizioStr,
    data_fine: dataFineStr,
    tutto_il_giorno: èTuttoIlGiorno, 
    category_id: categoryId,
    luogo: newEventForm.luogo || null,
    rrule: rruleString 
  };

  try {
    const veroId = eventToEdit ? String(eventToEdit.id).split('-')[0] : null;

    if (eventToEdit && veroId) {
      await updateEvent({ id: veroId, data: pacchettoPerIlServer }); // ✅ Corretto
    } else {
      await addEvent(pacchettoPerIlServer);
    }
    
    if (onEventSaved) onEventSaved();
    onClose();
  } catch (errore) {
    console.error("Errore nel salvataggio dell'evento", errore);
    // OTTIMA UX: Feedback visivo all'utente se la rete cade
    confirm({
      title: "Attenzione",
      message: "Si è verificato un errore durante il salvataggio.",
      confirmText: "Ho capito",
      isDestructive: false,
      onConfirm: () => {}
    });
  } finally {
    // 5. OTTIMA UX: Spegniamo il caricamento sempre e comunque
    setIsSaving(false); 
  }
};

  const orarioInizioScomposto = smontaOrario(newEventForm.ora_inizio);
  const orarioFineScomposto = smontaOrario(newEventForm.ora_fine);

  if (!isOpen) return null;

  return (

      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title={eventToEdit ? 'Modifica Evento' : 'Nuovo Evento'}
        maxWidthClass="max-w-lg" // Usiamo max-w-lg per far respirare i controlli orari/date
        formId="event-form"
        confirmText={eventToEdit ? 'Aggiorna Evento' : 'Salva Evento'}
        isLoading={isSaving}
        isConfirmDisabled={!newEventForm.titolo.trim()}
      >
        <form id="event-form" onSubmit={handleSalvaNuovoEvento} className="space-y-4">
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
                <input type="checkbox" id="allDayToggle" checked={newEventForm.tutto_il_giorno} onChange={(e) => setNewEventForm({...newEventForm, tutto_il_giorno: e.target.checked, ora_inizio: '', ora_fine: ''})} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer" />
                <label htmlFor="allDayToggle" className="text-sm font-bold text-gray-700 cursor-pointer select-none">Tutto il giorno</label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* DATA INIZIO */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Data Inizio</label>
                <DatePicker 
                  value={newEventForm.data_inizio}
                  onChange={(date) => setNewEventForm({ ...newEventForm, data_inizio: date })}
                  isOpen={activeDatePicker === 'start'}
                  onToggle={() => setActiveDatePicker(activeDatePicker === 'start' ? null : 'start')}
                  onClose={() => setActiveDatePicker(null)}
                />
              </div>

              {/* ORA INIZIO */}
              <div className="relative">
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ora Inizio</label>
                 <div className="relative flex items-center">
                   <div className={`w-full flex items-center justify-center gap-1 px-3 py-1.5 border border-gray-200 rounded-xl text-sm bg-white focus-within:border-blue-500 transition-colors ${newEventForm.tutto_il_giorno ? 'bg-gray-100' : ''}`}>
                     <input
                       type="text" placeholder="HH" maxLength={2} inputMode="numeric" disabled={newEventForm.tutto_il_giorno}
                       value={orarioInizioScomposto.ore}
                       onChange={(e) => {
                         const val = e.target.value.replace(/\D/g, '');
                         if (val && parseInt(val, 10) > 23) return;
                         setNewEventForm({...newEventForm, ora_inizio: val ? `${val}:${orarioInizioScomposto.minuti || '00'}` : (orarioInizioScomposto.minuti ? `00:${orarioInizioScomposto.minuti}` : '') });
                       }}
                       className="w-6 text-center bg-transparent focus:outline-none text-gray-700 font-medium disabled:text-gray-400"
                     />
                     <span className="text-gray-400 font-bold select-none">:</span>
                     <input
                       type="text" placeholder="MM" maxLength={2} inputMode="numeric" disabled={newEventForm.tutto_il_giorno}
                       value={orarioInizioScomposto.minuti}
                       onChange={(e) => {
                         const val = e.target.value.replace(/\D/g, '');
                         if (val && parseInt(val, 10) > 59) return;
                         setNewEventForm({...newEventForm, ora_inizio: val ? `${orarioInizioScomposto.ore || '00'}:${val}` : (orarioInizioScomposto.ore ? `${orarioInizioScomposto.ore}:00` : '') });
                       }}
                       className="w-6 text-center bg-transparent focus:outline-none text-gray-700 font-medium disabled:text-gray-400"
                     />
                   </div>
                   {newEventForm.ora_inizio && !newEventForm.tutto_il_giorno && (
                     <div className="absolute right-2 flex items-center bg-white pl-1 rounded-full">
                       <button type="button" onClick={() => setNewEventForm({...newEventForm, ora_inizio: ''})} className="text-red-400 hover:text-red-600 transition-colors">
                         <CancelIcon className="h-4 w-4" />
                       </button>
                     </div>
                   )}
                 </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              {/* DATA FINE */}
              <div className="relative">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Data Fine</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <DatePicker 
                      value={newEventForm.data_fine}
                      onChange={(date) => setNewEventForm({ ...newEventForm, data_fine: date })}
                      isOpen={activeDatePicker === 'end'}
                      onToggle={() => setActiveDatePicker(activeDatePicker === 'end' ? null : 'end')}
                      onClose={() => setActiveDatePicker(null)}
                      placeholder="Stesso giorno"
                    />
                  </div>
                  {newEventForm.data_fine && (
                    <button type="button" onClick={() => setNewEventForm({ ...newEventForm, data_fine: '' })} className="text-red-400 hover:text-red-600">
                      <CancelIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* ORA FINE */}
              <div className="relative">
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ora Fine</label>
                 <div className="relative flex items-center">
                   <div className={`w-full flex items-center justify-center gap-1 px-3 py-1.5 border border-gray-200 rounded-xl text-sm bg-white focus-within:border-blue-500 transition-colors ${newEventForm.tutto_il_giorno ? 'bg-gray-100' : ''}`}>
                     <input
                       type="text" placeholder="HH" maxLength={2} inputMode="numeric" disabled={newEventForm.tutto_il_giorno}
                       value={orarioFineScomposto.ore}
                       onChange={(e) => {
                         const val = e.target.value.replace(/\D/g, '');
                         if (val && parseInt(val, 10) > 23) return;
                         setNewEventForm({...newEventForm, ora_fine: val ? `${val}:${orarioFineScomposto.minuti || '00'}` : (orarioFineScomposto.minuti ? `00:${orarioFineScomposto.minuti}` : '') });
                       }}
                       className="w-6 text-center bg-transparent focus:outline-none text-gray-700 font-medium disabled:text-gray-400"
                     />
                     <span className="text-gray-400 font-bold select-none">:</span>
                     <input
                       type="text" placeholder="MM" maxLength={2} inputMode="numeric" disabled={newEventForm.tutto_il_giorno}
                       value={orarioFineScomposto.minuti}
                       onChange={(e) => {
                         const val = e.target.value.replace(/\D/g, '');
                         if (val && parseInt(val, 10) > 59) return;
                         setNewEventForm({...newEventForm, ora_fine: val ? `${orarioFineScomposto.ore || '00'}:${val}` : (orarioFineScomposto.ore ? `${orarioFineScomposto.ore}:00` : '') });
                       }}
                       className="w-6 text-center bg-transparent focus:outline-none text-gray-700 font-medium disabled:text-gray-400"
                     />
                   </div>

                   {newEventForm.ora_fine && !newEventForm.tutto_il_giorno && (
                     <div className="absolute right-2 flex items-center bg-white pl-1 rounded-full">
                       <button type="button" onClick={() => setNewEventForm({...newEventForm, ora_fine: ''})} className="text-red-400 hover:text-red-600 transition-colors">
                          <CancelIcon className="h-5 w-5" />
                          </button>
                     </div>
                   )}
                 </div>
              </div>
            </div>

            {/* SEZIONE RICORRENZA */}
            <RecurrenceEditor 
              isRecurrent={isRecurrent}
              onRecurrentChange={setIsRecurrent}
              interval={rruleInterval}
              onIntervalChange={setRruleInterval}
              freq={rruleFreq}
              onFreqChange={setRruleFreq}
              untilDate={rruleUntil}
              onUntilDateChange={setRruleUntil}
            />

            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <CategorySelect  
                  value={newEventForm.category} 
                  onChange={(catName) => setNewEventForm({...newEventForm, category: catName})} 
                  genreType={CategoryGenre.EVENTS} // 2 = Eventi
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Luogo</label>
                <input type="text" placeholder="Es. Ufficio, Roma..." value={newEventForm.luogo} onChange={(e) => setNewEventForm({...newEventForm, luogo: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
              </div>
            </div>

            </form>
      </BaseModal>
  );
};

export default NewEventModal;