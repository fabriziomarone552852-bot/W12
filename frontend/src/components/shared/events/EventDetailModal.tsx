// src/components/dashboard/EventDetailModal.tsx
import React, { useState, useEffect } from 'react';
import type { CalendarEvent } from '@/types';
import { translateRRule } from '@/utils/rruleUtils';
import BaseModal from '@/components/shared/dialog/BaseModal';
import { useConfirm } from '@/context/ConfirmContext';
import { Badge } from '@/components/shared/utils/Badges';
import { EditIcon, TrashIcon, ArrowRightLongIcon, LocationIcon } from '@/components/shared/utils/Icons';
import { formatToItalianShortDate } from '@/utils/dateUtils';

// Il "Pacchetto" da inviare alla HomePage
export interface EventDeletePayload {
  id: number;
  mode: 'single' | 'future' | 'all';
  dateStr: string;
  currentRrule?: string;
  currentEsclusioni?: string;
}

interface EventDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedEvent: CalendarEvent | null; 
  onEditClick: () => void;
  onDeleteClick: (payload: EventDeletePayload) => void; 
}

const EventDetailModal: React.FC<EventDetailModalProps> = ({ 
  isOpen, onClose, selectedEvent, onEditClick, onDeleteClick 
}) => {
  const { confirm } = useConfirm();
  const [showRecurringDeleteOptions, setShowRecurringDeleteOptions] = useState(false);

  // Resettiamo la vista del cestino ogni volta che il modale si chiude o cambia evento
  useEffect(() => {
    if (!isOpen) setShowRecurringDeleteOptions(false);
  }, [isOpen, selectedEvent]);

  if (!isOpen || !selectedEvent) return null;

  const dataInizio = formatToItalianShortDate(selectedEvent.dateStr);
  const dataFine = formatToItalianShortDate(selectedEvent.endDateStr);
  const haFine = (dataFine && dataFine !== dataInizio) || selectedEvent.endTime;

  // 1. Click sul Cestino
  const handleDeleteClick = () => {
    if (selectedEvent.rrule) {
      // 🪄 Invece del menu in alto, attiviamo la schermata di dialogo interna!
      setShowRecurringDeleteOptions(true);
    } else {
      // Evento normale: classico popup globale
      confirm({
        title: "Elimina Evento",
        message: "Sei sicuro di voler eliminare definitivamente questo evento dal calendario? L'azione non è reversibile.",
        confirmText: "Elimina",
        isDestructive: true,
        onConfirm: () => {
          onDeleteClick({
            id: selectedEvent.originalId as number,
            mode: 'all',
            dateStr: selectedEvent.dateStr ?? '' 
          });
        }
      });
    }
  };

  // 2. Azione dei bottoni di conferma
  const confirmRecurringDelete = (mode: 'single' | 'future' | 'all') => {
    onDeleteClick({
      id: selectedEvent.originalId as number,
      mode: mode,
      dateStr: selectedEvent.dateStr ?? '', 
      currentRrule: selectedEvent.rrule ?? undefined,
      currentEsclusioni: selectedEvent.esclusioni ?? undefined 
    });
    setShowRecurringDeleteOptions(false);
  };

  // Se siamo nella modalità di eliminazione, nascondiamo i bottoni in alto
  const HeaderActions = showRecurringDeleteOptions ? null : (
    <>
      <button title="Modifica" onClick={onEditClick} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
        <EditIcon className="h-5 w-5" />
      </button>
      <button title="Elimina" onClick={handleDeleteClick} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
        <TrashIcon className="h-5 w-5" />
      </button>
    </>
  );

  const HeaderTags = !showRecurringDeleteOptions && (
    <Badge variant="category" colorHex={selectedEvent.categoryColor}>
      {selectedEvent.category}
    </Badge>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={HeaderTags || <span />} // Manteniamo lo spazio se non ci sono tag
      headerActions={HeaderActions}
      maxWidthClass="max-w-md"
    >
      {/* 🪄 MAGIA: Swap condizionale del contenuto! */}
      {showRecurringDeleteOptions ? (
        
        // --- VISTA DIALOGO (ELIMINAZIONE RICORRENTE) ---
        <div className="flex flex-col items-center justify-center py-2 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-5">
            <TrashIcon className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-xl font-extrabold text-gray-900 mb-2">Elimina Evento Ricorrente</h3>
          <p className="text-sm text-gray-500 mb-8 px-2">
            Questo evento si ripete nel tempo. Quali occorrenze desideri rimuovere dal calendario?
          </p>
          
          <div className="flex flex-col gap-3 w-full">
            <button 
              onClick={() => confirmRecurringDelete('single')} 
              className="w-full py-3 px-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold rounded-xl transition-all shadow-sm hover:shadow"
            >
              Elimina solo questo evento
            </button>
            <button 
              onClick={() => confirmRecurringDelete('future')} 
              className="w-full py-3 px-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold rounded-xl transition-all shadow-sm hover:shadow"
            >
              Elimina questo e i successivi
            </button>
            <button 
              onClick={() => confirmRecurringDelete('all')} 
              className="w-full py-3 px-4 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold rounded-xl transition-all shadow-sm hover:shadow"
            >
              Elimina tutte le ripetizioni
            </button>
            <button 
              onClick={() => setShowRecurringDeleteOptions(false)} 
              className="w-full py-3 px-4 mt-2 text-gray-500 hover:text-gray-800 hover:bg-gray-50 font-bold rounded-xl transition-all"
            >
              Annulla operazione
            </button>
          </div>
        </div>

      ) : (

        // --- VISTA NORMALE (DETTAGLIO EVENTO) ---
        <div className="space-y-4 animate-in fade-in duration-200">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-800">{selectedEvent.title}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-sm font-bold text-red-500">
              <span>Data: {dataInizio} {selectedEvent.time && ` ${selectedEvent.time}`}</span>
              {haFine && (
                <>
                  <ArrowRightLongIcon className="w-4 h-4" />
                  <span>
                    {dataFine && dataFine !== dataInizio ? `${dataFine} ` : ''}
                    {selectedEvent.endTime && ` ${selectedEvent.endTime}`}
                  </span>
                </>
              )}
            </div>
            
            {selectedEvent.rrule && (
              <div className="mt-2 inline-block px-2.5 py-1 text-xs font-bold rounded-md bg-blue-100 text-blue-700">
                🔄 {translateRRule(selectedEvent.rrule, selectedEvent.dateStr)}
              </div>
            )}
          </div>

          {selectedEvent.location && (
            <div className="flex items-center gap-2 text-gray-600 text-sm">
              <LocationIcon className="w-5 h-5 text-gray-400" />
              {selectedEvent.location}
            </div>
          )}
          
          {selectedEvent.description && (
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">Note aggiuntive</h4>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedEvent.description}</p>
            </div>
          )}
        </div>
      )}
    </BaseModal>
  );
};

export default EventDetailModal;