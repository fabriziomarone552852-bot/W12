// src/components/day/RoutineNewModal.tsx
import React, { useState, useEffect } from 'react';
import type { RoutineItem } from './RoutineColumn';
import DatePicker from '../shared/utils/DatePicker'; 
import { getLocalDateString } from '../../utils/dateUtils'; 
import { parseRRule, buildRRule } from '../../utils/rruleUtils'; 
import BaseModal from '../shared/dialog/BaseModal';
import { RecurrenceEditor } from '../shared/utils/RecurrenceEditor';

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
  onSave: (routineData: RoutineSavePayload) => Promise<void> | void;
}

const RoutineNewModal: React.FC<RoutineNewModalProps> = ({ isOpen, onClose, routineToEdit, onSave }) => {
  const [form, setForm] = useState({
    titolo: '',
    data_inizio: getLocalDateString(),
    immagine_url: '',
    piu_volte: false,
    target_completamenti: 1,
    rruleInterval: '1',
    rruleFreq: 'DAILY',
    rruleUntil: '',       
    isRecurrent: true
  });

  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (routineToEdit) {
        const { isRecurrent, freq, interval, until } = parseRRule(routineToEdit.rrule);
        setForm({
          titolo: routineToEdit.titolo || '',
          data_inizio: routineToEdit.data_inizio || getLocalDateString(),
          immagine_url: routineToEdit.imageUrl || '',
          piu_volte: routineToEdit.targetCompletions > 1,
          target_completamenti: routineToEdit.targetCompletions || 1,
          rruleFreq: freq,
          rruleInterval: interval,
          rruleUntil: until,
          isRecurrent: isRecurrent
        });
      } else {
        setForm({
          titolo: '',
          data_inizio: getLocalDateString(),
          immagine_url: '',
          piu_volte: false,
          target_completamenti: 1,
          rruleFreq: 'DAILY',
          rruleInterval: '1',
          rruleUntil: '', 
          isRecurrent: true
        });
      }
    } else {
      setIsDatePickerOpen(false);
    }
  }, [isOpen, routineToEdit]);

  // 3. handleSubmit aggiornato con async, try/finally e form.*
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true); // <-- Accendiamo il caricamento

    try {
      // 🪄 Creiamo la stringa RRULE solo se isRecurrent è true
      const rruleString = form.isRecurrent 
        ? buildRRule(form.rruleFreq, form.rruleInterval, form.rruleUntil) 
        : '';

      const payload: RoutineSavePayload = {
        titolo: form.titolo,
        tipo: 'R', 
        data_inizio: form.data_inizio,
        immagine_url: form.immagine_url || '',
        target_completamenti: form.target_completamenti,
        rrule: rruleString
      };

      await onSave(payload);
      onClose();
    } catch (error) {
      console.error("Errore nel salvataggio:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={routineToEdit ? 'Modifica Routine' : 'Nuova Routine'}
      maxWidthClass="max-w-lg" // <--- Importante per le routine!
      formId="routine-form"
      confirmText={routineToEdit ? 'Aggiorna' : 'Crea Routine'}
      isConfirmDisabled={!form.titolo.trim()}
      isLoading={isSaving}
    >
      <form id="routine-form" onSubmit={handleSubmit} className="space-y-5">
          
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Nome Routine</label>
            <input type="text" required placeholder="Es. Skincare Serale, Lettura..." value={form.titolo} onChange={(e) => setForm({...form, titolo: e.target.value})} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">A partire dal</label>
              {/* MAGIA: DatePicker */}
              <DatePicker 
                value={form.data_inizio}
                onChange={(val) => setForm({...form, data_inizio: val})}
                isOpen={isDatePickerOpen}
                onToggle={() => setIsDatePickerOpen(!isDatePickerOpen)}
                onClose={() => setIsDatePickerOpen(false)}
                placeholder="Oggi"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Ricorrenza</label>
              <RecurrenceEditor 
                isRecurrent={form.isRecurrent}
                onRecurrentChange={(val) => setForm({...form, isRecurrent: val})}
                interval={form.rruleInterval}
                onIntervalChange={(val) => setForm({...form, rruleInterval: val})}
                freq={form.rruleFreq}
                onFreqChange={(val) => setForm({...form, rruleFreq: val})}
                untilDate={form.rruleUntil}
                onUntilDateChange={(val) => setForm({...form, rruleUntil: val})}
              />
            </div>
          </div>

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

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Immagine di Sfondo (URL)</label>
            <input type="url" value={form.immagine_url} onChange={e => setForm({...form, immagine_url: e.target.value})} placeholder="Incolla l'URL di un'immagine..." className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm" />
            <p className="text-[10px] text-gray-400 font-medium mt-1.5 ml-1">Verrà usata per decorare la card.</p>
          </div>

        </form>
    </BaseModal>
  );
};

export default RoutineNewModal;