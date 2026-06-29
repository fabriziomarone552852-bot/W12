// src/components/day/CountdownNewModal.tsx
import React, { useState, useEffect } from 'react';
import type { CountdownItem } from './CountdownWidget';
import DatePicker from '../shared/utils/DatePicker';
import TimeInput from '../shared/utils/TimeInput'; 
import { combineDateAndTime, pad } from '../../utils/dateUtils'; 
import BaseModal from '../shared/dialog/BaseModal';

interface CountdownNewModalProps {
  isOpen: boolean;
  onClose: () => void;
  countdownToEdit?: CountdownItem | null;
  onSave: (cd: Partial<CountdownItem>) => Promise<void> | void;
}

const CountdownNewModal: React.FC<CountdownNewModalProps> = ({ isOpen, onClose, countdownToEdit, onSave }) => {
  const [title, setTitle] = useState('');
  const [dateStr, setDateStr] = useState(''); 
  const [timeStr, setTimeStr] = useState(''); 
  const [imageUrl, setImageUrl] = useState('');

  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (countdownToEdit && isOpen) {
      setTitle(countdownToEdit.title);
      setImageUrl(countdownToEdit.imageUrl);
      
      const d = new Date(countdownToEdit.targetDateStr);
      const yyyy = d.getFullYear();
      const mm = pad(d.getMonth() + 1);
      const dd = pad(d.getDate());
      
      setDateStr(`${yyyy}-${mm}-${dd}`);
      setTimeStr(`${pad(d.getHours())}:${pad(d.getMinutes())}`);
    } else {
      setTitle('');
      setDateStr('');
      setTimeStr('');
      setImageUrl('');
    }
    setIsDatePickerOpen(false);
  }, [countdownToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dateStr) return;
    
    setIsSaving(true); // 🟢 Accendiamo lo spinner!

    try {
      const finalIso = combineDateAndTime(dateStr, timeStr);

      // Aspettiamo che il backend finisca di salvare
      await onSave({
        id: countdownToEdit?.id,
        title,
        targetDateStr: finalIso,
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1506744626753-143283d115a0?q=80&w=800'
      });
      
      onClose(); // Chiudiamo solo se è andato tutto bene
    } catch (error) {
      console.error("Errore durante il salvataggio:", error);
    } finally {
      setIsSaving(false); // 🔴 Spegniamo lo spinner in ogni caso
    }
  };

  if (!isOpen) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={countdownToEdit ? 'Modifica Countdown' : 'Nuovo Countdown'}
      maxWidthClass="max-w-md"
      formId="countdown-form"
      confirmText={countdownToEdit ? 'Salva Modifiche' : 'Crea Countdown'}
      isConfirmDisabled={!dateStr || !title.trim()}
      isLoading={isSaving} 
    >
      <form id="countdown-form" onSubmit={handleSubmit} className="space-y-5">

        
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Titolo Evento</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Es. Esame di Stato, Compleanno..." className="w-full bg-white border border-gray-200 text-gray-800 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 shadow-sm" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Data Scadenza</label>
              {/* MAGIA 1: DatePicker */}
              <DatePicker 
                value={dateStr}
                onChange={setDateStr}
                isOpen={isDatePickerOpen}
                onToggle={() => setIsDatePickerOpen(!isDatePickerOpen)}
                onClose={() => setIsDatePickerOpen(false)}
              />
            </div>

            <div>
               <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Ora Scadenza</label>
               {/* MAGIA 2: TimeInput */}
               <TimeInput value={timeStr} onChange={setTimeStr} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Sfondo Personalizzato</label>
            <input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="Incolla l'URL dell'immagine..." className="w-full bg-white border border-gray-200 text-gray-800 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 shadow-sm" />
            <p className="text-[10px] text-gray-400 font-medium mt-1.5 ml-1">Se lasciato vuoto, verrà utilizzata un'immagine di default.</p>
          </div>

        </form>
      
    </BaseModal>
  );
};

export default CountdownNewModal;