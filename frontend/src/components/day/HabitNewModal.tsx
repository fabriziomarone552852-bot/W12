// src/components/day/HabitNewModal.tsx
import React, { useState, useEffect } from 'react';

const getLocalDateString = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
};

interface HabitNewModalProps {
  isOpen: boolean; 
  onClose: () => void;
  onSave: (habitData: any) => void; 
}

const HabitNewModal: React.FC<HabitNewModalProps> = ({ isOpen, onClose, onSave }) => {
  const [form, setForm] = useState({
    titolo: '',
    icona: '✨', // Emoji di default
  });

  useEffect(() => {
    if (isOpen) {
      setForm({
        titolo: '',
        icona: '✨',
      });
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // RRule fisso per le Habits: 1 volta al giorno
    const rruleString = `FREQ=DAILY;INTERVAL=1`;

    const payload = {
      titolo: form.titolo,
      tipo: 'H', // Identificativo per Habit
      data_inizio: getLocalDateString(), // Inizia da oggi
      immagine_url: form.icona, // Salviamo l'emoji qui per compatibilità col DB
      rrule: rruleString,
      attiva: true
    };

    onSave(payload);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-visible transform transition-all animate-fadeIn relative pointer-events-auto" onClick={(e) => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
          <h3 className="text-lg font-extrabold text-gray-800 uppercase tracking-wider">
            Nuova Abitudine
          </h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          <div className="flex gap-4">
            {/* ICONA/EMOJI */}
            <div className="w-1/4 shrink-0">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Icona</label>
              <input 
                type="text" 
                maxLength={2} 
                required 
                value={form.icona} 
                onChange={(e) => setForm({...form, icona: e.target.value})} 
                className="w-full h-[42px] text-center border border-gray-200 rounded-xl text-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm" 
              />
            </div>

            {/* TITOLO */}
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Nome</label>
              <input 
                type="text" 
                required 
                placeholder="Es. Leggere, Meditare..." 
                value={form.titolo} 
                onChange={(e) => setForm({...form, titolo: e.target.value})} 
                className="w-full h-[42px] px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm" 
              />
            </div>
          </div>

          {/* MESSAGGIO INFORMATIVO */}
          <div className="bg-blue-50 text-blue-800 p-3 rounded-xl text-xs font-medium flex gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Le abitudini vengono impostate automaticamente con frequenza giornaliera a partire da oggi.
          </div>

          {/* PULSANTI */}
          <div className="pt-2 border-t border-gray-100 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors shadow-sm">Annulla</button>
            <button type="submit" disabled={!form.titolo.trim()} className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
              Crea
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default HabitNewModal;