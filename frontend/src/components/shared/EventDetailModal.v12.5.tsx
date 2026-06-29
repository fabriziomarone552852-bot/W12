// src/components/dashboard/EventDetailModal.tsx
import React from 'react';
import type { CalendarEvent } from '../dashboard/CalendarColumn';
import { getTextColorForBackground } from '../../utils/uiUtils';
import { translateRRule } from '../../utils/rruleUtils';
import BaseModal from '../shared/dialog/BaseModal';
import { useConfirm } from '../../context/ConfirmContext';

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

  const formatDate = (dStr?: string) => dStr ? dStr.split('-').reverse().join('/') : '';
  const dataInizio = formatDate(selectedEvent.dateStr);
  const dataFine = formatDate(selectedEvent.endDateStr);
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
    <span className={`px-2 py-1 text-[10px] font-bold rounded-md uppercase ${getTextColorForBackground(selectedEvent.categoryColor)}`} style={{ backgroundColor: selectedEvent.categoryColor || '#9CA3AF' }}>
      {selectedEvent.category}
    </span>
  );

  const HeaderActions = (
    <>
      <button title="Modifica" onClick={onEditClick} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
      </button>
      <button title="Elimina" onClick={handleDelete} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  <span>
                    {dataFine && dataFine !== dataInizio ? `${dataFine} ` : ''}
                    {selectedEvent.endTime && ` ${selectedEvent.endTime}`}
                  </span>
                </>
              )}
            </div>
            
            {selectedEvent.rrule && (
              <div className="mt-2 inline-block px-2.5 py-1 text-xs font-bold rounded-md bg-blue-100 text-blue-700">
                🔄 {translateRRule(selectedEvent.rrule)}
              </div>
            )}
          </div>

          {selectedEvent.location && (
            <div className="flex items-center gap-2 text-gray-600 text-sm">
              <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
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