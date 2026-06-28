// src/components/dashboard/EventDetailModal.tsx
import React, { useState } from 'react';
import type { CalendarEvent } from '../dashboard/CalendarColumn';

interface EventDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedEvent: CalendarEvent | null; 
  onEditClick: () => void;
  onDeleteClick: (id: number | string) => void; 
}

const getTextColorForBackground = (hexColor?: string) => {
  if (!hexColor) return 'text-white';
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return ((r * 299 + g * 587 + b * 114) / 1000) > 128 ? 'text-gray-900' : 'text-white';
};

const EventDetailModal: React.FC<EventDetailModalProps> = ({ 
  isOpen, onClose, selectedEvent, onEditClick, onDeleteClick 
}) => {
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  if (!isOpen || !selectedEvent) return null;

  const formatDate = (dStr?: string) => dStr ? dStr.split('-').reverse().join('/') : '';

  const dataInizio = formatDate(selectedEvent.dateStr);
  const dataFine = formatDate(selectedEvent.endDateStr);
  
  const haFine = (dataFine && dataFine !== dataInizio) || selectedEvent.endTime;

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      
      {isDeleteDialogOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center z-[60] p-4 pointer-events-auto"
          onClick={(e) => { e.stopPropagation(); setIsDeleteDialogOpen(false); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center animate-fadeIn transform transition-all scale-100" onClick={(e) => e.stopPropagation()} >
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <h3 className="text-lg font-extrabold text-gray-900 mb-2">Elimina Evento</h3>
            <p className="text-sm text-gray-600 mb-6">Sei sicuro di voler eliminare definitivamente questo evento dal calendario? L'azione non è reversibile.</p>
            {selectedEvent.rrule && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs p-3 rounded-lg mb-6 text-left shadow-sm">
                <strong>⚠️ Attenzione:</strong> Questo è un evento ricorrente. Procedendo, eliminerai questo evento e <strong>tutte le sue ripetizioni</strong> (passate e future).
              </div>
            )}
            <div className="flex gap-3">
              <button type="button" onClick={() => setIsDeleteDialogOpen(false)} className="flex-1 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl font-bold text-sm transition-colors">Annulla</button>
              <button type="button" onClick={() => { onDeleteClick(selectedEvent.id); setIsDeleteDialogOpen(false); onClose(); }} className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-sm transition-colors">Elimina</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-4 items-start w-full max-w-md justify-center pointer-events-none">
        <div className="bg-white rounded-2xl shadow-2xl w-full overflow-hidden transform transition-all animate-fadeIn pointer-events-auto flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 text-[10px] font-bold rounded-md uppercase ${getTextColorForBackground(selectedEvent.categoryColor)}`} style={{ backgroundColor: selectedEvent.categoryColor || '#9CA3AF' }}>
                {selectedEvent.category}
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              <button title="Modifica evento" onClick={onEditClick} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
              <button title="Elimina evento" onClick={() => setIsDeleteDialogOpen(true)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
              <div className="w-px h-5 bg-gray-300 mx-1"></div>
              <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
          </div>
          
          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-gray-50 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
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
          
        </div>
      </div>
    </div>
  );
};

export default EventDetailModal;