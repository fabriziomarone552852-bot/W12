// src/components/dashboard/EventDetailModal.tsx
import React from 'react';
import type { CalendarEvent } from '../dashboard/CalendarColumn';
import { translateRRule } from '../../utils/rruleUtils';
import BaseModal from '../shared/dialog/BaseModal';
import { useConfirm } from '../../context/ConfirmContext';
import { Badge } from '../shared/utils/Badges';
import { EditIcon, TrashIcon, ArrowRightLongIcon, LocationIcon } from '../shared/utils/Icons';
import { formatToItalianShortDate } from '../../utils/dateUtils';

interface EventDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedEvent: CalendarEvent | null; 
  onEditClick: () => void;
  onDeleteClick: (id: number | string) => void; 
}

const EventDetailModal: React.FC<EventDetailModalProps> = ({ 
  isOpen, onClose, selectedEvent, onEditClick, onDeleteClick 
}) => {
  const { confirm } = useConfirm();

  if (!isOpen || !selectedEvent) return null;

  const dataInizio = formatToItalianShortDate(selectedEvent.dateStr);
  const dataFine = formatToItalianShortDate(selectedEvent.endDateStr);
  const haFine = (dataFine && dataFine !== dataInizio) || selectedEvent.endTime;

  const handleDelete = () => {
    confirm({
      title: "Elimina Evento",
      message: (
        <>
          <p className="mb-4">Sei sicuro di voler eliminare definitivamente questo evento dal calendario? L'azione non è reversibile.</p>
          {selectedEvent.rrule && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs p-3 rounded-lg text-left shadow-sm">
              <strong>⚠️ Attenzione:</strong> Questo è un evento ricorrente. Procedendo, eliminerai questo evento e <strong>tutte le sue ripetizioni</strong>.
            </div>
          )}
        </>
      ),
      confirmText: "Elimina",
      isDestructive: true,
      onConfirm: () => {
        onDeleteClick(selectedEvent.id);
        onClose();
      }
    });
  };

  const HeaderTags = (
    <Badge variant="category" colorHex={selectedEvent.categoryColor}>
      {selectedEvent.category}
    </Badge>
  );
  
  const HeaderActions = (
    <>
      <button title="Modifica" onClick={onEditClick} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
        <EditIcon className="h-5 w-5" />
      </button>
      <button title="Elimina" onClick={handleDelete} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
        <TrashIcon className="h-5 w-5" />
      </button>
    </>
  );

      return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={HeaderTags}
      headerActions={HeaderActions}
      maxWidthClass="max-w-md"
    >
      <div className="space-y-4">
          
          <div>
            <h2 className="text-2xl font-extrabold text-gray-800">{selectedEvent.title}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-sm font-bold text-red-500">
              <span>Data: {dataInizio} {selectedEvent.time && ` ${selectedEvent.time}`}</span>
              {haFine && (
                <>
                  <ArrowRightLongIcon />
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
              <LocationIcon />
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
        {/* FINE BODY */}
        
      
    </BaseModal>
  );
};

export default EventDetailModal;