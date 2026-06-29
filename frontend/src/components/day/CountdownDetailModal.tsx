// src/components/day/CountdownDetailModal.tsx
import React, { useState } from 'react';
import type { CountdownItem } from './CountdownWidget';
import { calculateTimeLeft } from '../../utils/dateUtils'; 
import ConfirmDialog from '../shared/dialog/ConfirmDialog'; 
import TickDisplay from './utils/TickDisplay';
import { TrashIcon, EditIcon, CloseIcon } from '../shared/utils/Icons';

interface CountdownDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  countdown: CountdownItem | null;
  onEditClick: () => void;
  onDeleteClick: (id: number) => void;
}

const CountdownDetailModal: React.FC<CountdownDetailModalProps> = ({ isOpen, onClose, countdown, onEditClick, onDeleteClick }) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  if (!isOpen || !countdown) return null;

  const timeLeft = calculateTimeLeft(countdown.targetDateStr);
  const targetDate = new Date(countdown.targetDateStr);

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      
      {/* MAGIA: Dialogo di Eliminazione */}
      <ConfirmDialog 
        isOpen={isDeleteDialogOpen}
        title="Elimina Countdown"
        message="Sei sicuro di voler eliminare questo countdown? L'azione non è reversibile."
        confirmText="Elimina"
        isDestructive={true}
        onCancel={() => setIsDeleteDialogOpen(false)}
        onConfirm={() => { onDeleteClick(countdown.id); setIsDeleteDialogOpen(false); onClose(); }}
      />

      {/* CARD PRINCIPALE */}
      <div 
        className="relative w-full max-w-sm h-[70vh] rounded-3xl shadow-2xl overflow-hidden transform transition-all animate-fadeIn"
        onClick={e => e.stopPropagation()}
      >
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${countdown.imageUrl})` }} />
        <div className="absolute inset-0 bg-black/60" />

        <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-10">
          <button onClick={onClose} className="p-2 bg-black/30 hover:bg-black/50 backdrop-blur-md rounded-full text-white transition-colors">
            <CloseIcon className="w-5 h-5" />
          </button>
          <div className="flex gap-2">
            <button onClick={onEditClick} className="p-2 bg-black/30 hover:bg-amber-500/80 backdrop-blur-md rounded-full text-white transition-colors">
               <EditIcon className="w-4 h-4" />
            </button>
            <button onClick={() => setIsDeleteDialogOpen(true)} className="p-2 bg-black/30 hover:bg-red-500/80 backdrop-blur-md rounded-full text-white transition-colors">
               <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Contenuto Centrale */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-0 mt-8">
          <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-2 drop-shadow-lg">{countdown.title}</h2>
          <p className="text-sm font-bold text-gray-300 tracking-wider mb-8 uppercase">
            {targetDate.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>

          <TickDisplay targetDateStr={countdown.targetDateStr} />
        </div>

      </div>
    </div>
  );
};

export default CountdownDetailModal;