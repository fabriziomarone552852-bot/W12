// src/components/day/HabitNewModal.tsx
import React, { useState, useEffect } from 'react';
import { getLocalDateString } from '../../utils/dateUtils'; 
import BaseModal from '../shared/dialog/BaseModal';
import { InfoIcon } from '../shared/utils/Icons';
import { buildRRule } from '../../utils/rruleUtils';

export interface HabitSavePayload {
  titolo: string;
  tipo: string;
  data_inizio: string;
  immagine_url: string;
  rrule: string;
  attiva: boolean;
}

interface HabitNewModalProps {
  isOpen: boolean; 
  onClose: () => void;
  onSave: (habitData: HabitSavePayload) => Promise<void> | void; 
}

const HabitNewModal: React.FC<HabitNewModalProps> = ({ isOpen, onClose, onSave }) => {
  const [form, setForm] = useState({
    titolo: '',
    icona: '✨',
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm({ titolo: '', icona: '✨' });
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true); // 🟢 Inizio caricamento

    try {
      const payload = {
        titolo: form.titolo,
        tipo: 'H', 
        data_inizio: getLocalDateString(), 
        immagine_url: form.icona, 
        rrule: buildRRule('DAILY', '1', ''),
        attiva: true
      };

      await onSave(payload);
      onClose();
    } catch (error) {
      console.error("Errore creazione abitudine:", error);
    } finally {
      setIsSaving(false); // 🔴 Fine caricamento
    }
  };

  if (!isOpen) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Nuova Abitudine"
      maxWidthClass="max-w-sm" // In HabitNewModal usavi max-w-sm
      formId="habit-form"
      confirmText="Crea"
      isConfirmDisabled={!form.titolo.trim()}
      isLoading={isSaving} 
    >
      {/* Da qui in poi c'è SOLO l'HTML che riguarda strettamente il form! */}
      <form id="habit-form" onSubmit={handleSubmit} className="space-y-5">
        <div className="flex gap-4">
          <div className="w-1/4 shrink-0">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Icona</label>
            <input 
              type="text" maxLength={2} required 
              value={form.icona} 
              onChange={(e) => setForm({...form, icona: e.target.value})} 
              className="w-full h-[42px] text-center border border-gray-200 rounded-xl text-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm" 
            />
          </div>

          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Nome</label>
            <input 
              type="text" required placeholder="Es. Leggere, Meditare..." 
              value={form.titolo} 
              onChange={(e) => setForm({...form, titolo: e.target.value})} 
              className="w-full h-[42px] px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm" 
            />
          </div>
        </div>

        <div className="bg-blue-50 text-blue-800 p-3 rounded-xl text-xs font-medium flex gap-2">
          <InfoIcon className="h-4 w-4 shrink-0 mt-0.5" />
          Le abitudini vengono impostate automaticamente con frequenza giornaliera a partire da oggi.
        </div>
      </form>
    </BaseModal>
  );
};

export default HabitNewModal;