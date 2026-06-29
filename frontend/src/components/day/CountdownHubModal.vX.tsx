// src/components/day/CountdownsHubModal.tsx
import React, { useEffect, useState, useMemo } from 'react';
import type { CountdownItem } from './CountdownWidget';
import BaseModal from '../shared/dialog/BaseModal';
import TickDisplay from './utils/TickDisplay';
import { CloseIcon, PlusIcon } from '../shared/utils/Icons';

interface CountdownsHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  countdowns: CountdownItem[];
  onSelectCountdown: (cd: CountdownItem) => void;
  onNewClick: () => void;
}

const CountdownsHubModal: React.FC<CountdownsHubModalProps> = ({ 
  isOpen, onClose, countdowns, onSelectCountdown, onNewClick 
}) => {
  

  // OTTIMIZZAZIONE: Ordiniamo l'array solo se cambiano i countdowns!
  // I re-render causati dal timer (now) ignoreranno questo blocco.
  const sortedCountdowns = useMemo(() => {
    return [...countdowns].sort((a, b) => {
      return new Date(a.targetDateStr).getTime() - new Date(b.targetDateStr).getTime();
    });
  }, [countdowns]);

  if (!isOpen) return null;

  // --- COSTRUZIONE DEI PEZZI DEL MODALE ---

  const HeaderTitle = (
    <div className="flex items-center gap-2 text-lg font-black text-gray-800 uppercase tracking-widest">
      <CloseIcon className="w-5 h-5" />
      Tutti i Countdowns
    </div>
  );

  const ModalFooter = (
    <button 
      onClick={() => {
        onNewClick();
        onClose(); 
      }}
      className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 active:scale-95 active:bg-blue-100 transition-all flex justify-center items-center font-bold text-sm gap-2"
    >
      <PlusIcon className="w-5 h-5" />
      Crea Nuovo
    </button>
  );

  // --- RETURN CON BASEMODAL ---
  
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={HeaderTitle}
      footer={ModalFooter}
      maxWidthClass="max-w-md"
    >
      {/* IL BODY */}
      <div className="space-y-4">
        {sortedCountdowns.map(cd => {
          const targetDate = new Date(cd.targetDateStr);
          const isPast = new Date(cd.targetDateStr).getTime() < new Date().getTime(); // Questo si aggiorna sempre dinamicamente al tick di 'now'!

          return (
            <div 
              key={cd.id} 
              onClick={() => {
                onSelectCountdown(cd);
                onClose(); 
              }}
              className={`relative h-24 w-full rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-all group ${isPast ? 'opacity-60 grayscale' : ''}`}
            >
              <div className="absolute inset-0 bg-cover bg-center transition-transform group-hover:scale-105" style={{ backgroundImage: `url(${cd.imageUrl})` }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-0 left-0 w-full p-3">
                <h3 className="text-white font-bold text-sm uppercase tracking-wide truncate">{cd.title}</h3>
                <TickDisplay targetDateStr={cd.targetDateStr} variant="hub" />
              </div>
            </div>
          );
        })}

        {sortedCountdowns.length === 0 && (
          <div className="text-center text-gray-400 text-sm mt-10 italic">Nessun countdown attivo.</div>
        )}
      </div>
    </BaseModal>
  );
};

export default CountdownsHubModal;