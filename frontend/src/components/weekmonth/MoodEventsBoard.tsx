import React, { useState, useRef, useEffect } from 'react';
import { PlusIcon, TrashIcon } from '@/components/shared/utils/Icons';

export type MoodEventType = 'EP' | 'EN';

export interface MoodEvent {
  id: number;
  title: string;
  type: MoodEventType;
  date: string;
}

interface MoodEventsBoardProps {
  positiveEvents: MoodEvent[];
  negativeEvents: MoodEvent[];
  onAddMoodEvent: (type: MoodEventType, title: string) => void;
  onUpdateMoodEvent: (id: number, newTitle: string) => void;
  onDeleteMoodEvent: (id: number) => void;
}

const MoodEventsBoard: React.FC<MoodEventsBoardProps> = ({
  positiveEvents,
  negativeEvents,
  onAddMoodEvent,
  onUpdateMoodEvent,
  onDeleteMoodEvent
}) => {
  // Stato per AGGIUNGERE un nuovo evento
  const [addingType, setAddingType] = useState<MoodEventType | null>(null);
  const [inputValue, setInputValue] = useState<string>('');
  
  // Stato per MODIFICARE un evento esistente
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const addTextAreaRef = useRef<HTMLTextAreaElement>(null);
  const editTextAreaRef = useRef<HTMLTextAreaElement>(null);

  // Autofocus quando si aggiunge
  useEffect(() => {
    if (addingType && addTextAreaRef.current) {
      addTextAreaRef.current.focus();
    }
  }, [addingType]);

  // Autofocus quando si modifica
  useEffect(() => {
    if (editingId && editTextAreaRef.current) {
      editTextAreaRef.current.focus();
      // Posiziona il cursore alla fine del testo
      editTextAreaRef.current.selectionStart = editTextAreaRef.current.value.length;
    }
  }, [editingId]);

  // --- LOGICA AGGIUNTA ---
  const handleSaveNew = (type: MoodEventType) => {
    const trimmedVal = inputValue.trim();
    if (trimmedVal) {
      onAddMoodEvent(type, trimmedVal);
    }
    setAddingType(null);
    setInputValue('');
  };

  const handleKeyDownNew = (e: React.KeyboardEvent<HTMLTextAreaElement>, type: MoodEventType) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveNew(type);
    }
    if (e.key === 'Escape') {
      setAddingType(null);
      setInputValue('');
    }
  };

  // --- LOGICA MODIFICA ---
  const handleStartEdit = (ev: MoodEvent) => {
    // Se stavamo aggiungendo qualcosa, lo chiudiamo
    setAddingType(null); 
    setEditingId(ev.id);
    setEditValue(ev.title);
  };

  const handleSaveEdit = () => {
    const trimmedVal = editValue.trim();
    if (trimmedVal && editingId !== null) {
      onUpdateMoodEvent(editingId, trimmedVal);
    }
    setEditingId(null);
    setEditValue('');
  };

  const handleKeyDownEdit = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    }
    if (e.key === 'Escape') {
      setEditingId(null);
      setEditValue('');
    }
  };

  // --- RENDERING SEZIONE ---
  const renderEventSection = (
    title: string,
    type: MoodEventType,
    events: MoodEvent[],
    themeColor: 'green' | 'red'
  ) => {
    const limitedEvents = events.slice(0, 9);
    const hasRoomForMore = limitedEvents.length < 9;
    const isSingleItem = limitedEvents.length === 1;
    const isAddingHere = addingType === type;
    const [primaParola, secondaParola] = title.split(' ');

    return (
      <div className="col-span-4 grid grid-cols-4 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-48">
        
        {/* COLONNA TITOLO */}
        <div className={`col-span-1 flex flex-col items-center justify-center text-center p-3`}>
          <h3 className={`flex flex-col text-base sm:text-lg font-black tracking-wider uppercase w-full select-none ${themeColor === 'green' ? 'text-green-600' : 'text-red-600'}`}>
            <span>{primaParola}</span>
            <span>{secondaParola}</span>
          </h3>
        </div>

        {/* GRIGLIA EVENTI */}
        <div className="col-span-3 p-2 grid grid-cols-3 auto-rows-fr gap-2 overflow-hidden relative">
          
          {limitedEvents.map((ev) => {
            const isEditingThis = editingId === ev.id;
            
            return isEditingThis ? (
              // MODALITA' MODIFICA
              <div 
                key={ev.id}
                className={`
                  col-span-1 flex flex-col items-center justify-center rounded-lg border-2 border-solid shadow-inner p-1 bg-white
                  ${themeColor === 'green' ? 'border-green-400' : 'border-red-400'}
                `}
              >
                <textarea
                  ref={editTextAreaRef}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDownEdit}
                  onBlur={handleSaveEdit}
                  className={`
                    w-full h-full resize-none outline-none text-center bg-transparent text-[11px] font-bold custom-scrollbar
                    ${themeColor === 'green' ? 'text-green-900' : 'text-red-900'}
                  `}
                />
                {/* TASTO ELIMINA (Cestino) */}
                <button 
                  onMouseDown={(e) => { 
                    e.preventDefault(); // Previene l'onBlur della textarea
                    onDeleteMoodEvent(ev.id); 
                    setEditingId(null);
                  }}
                  className="mt-1 p-1 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            ) : (
              // MODALITA' LETTURA
              <div
                key={ev.id}
                onClick={() => handleStartEdit(ev)}
                className={`
                  cursor-pointer rounded-lg p-2 flex flex-col justify-center items-center text-center transition-all hover:scale-[1.02] active:scale-95 shadow-sm border overflow-hidden
                  ${isSingleItem && !isAddingHere ? 'col-span-3' : 'col-span-1'}
                  ${themeColor === 'green' ? 'bg-green-100 border-green-200 text-green-800 hover:bg-green-200/70' : 'bg-red-100 border-red-200 text-red-800 hover:bg-red-200/70'}
                `}
              >
                <span className="text-[11px] font-bold line-clamp-2 break-words px-1">{ev.title}</span>
              </div>
            );
          })}

          {/* TASTO PIÙ */}
          {hasRoomForMore && !isAddingHere && (
            <button
              onClick={() => {
                setEditingId(null); // Chiudi eventuali modifiche aperte
                setAddingType(type);
              }}
              className={`
                flex items-center justify-center rounded-lg border-2 border-dashed transition-colors outline-none
                ${limitedEvents.length === 0 ? 'col-span-3 row-span-3' : isSingleItem ? 'col-span-3' : 'col-span-1'}
                ${themeColor === 'green' ? 'border-green-300 text-green-400 hover:bg-green-50 hover:text-green-600' : 'border-red-300 text-red-400 hover:bg-red-50 hover:text-red-600'}
              `}
            >
              <PlusIcon className="w-5 h-5 animate-pulse" />
            </button>
          )}

          {/* TEXTAREA PER NUOVO EVENTO */}
          {isAddingHere && (
            <div 
              className={`
                flex items-center justify-center rounded-lg border-2 border-solid shadow-inner p-1.5 bg-white
                ${limitedEvents.length === 0 ? 'col-span-3 row-span-3' : isSingleItem ? 'col-span-3' : 'col-span-1'}
                ${themeColor === 'green' ? 'border-green-400' : 'border-red-400'}
              `}
            >
              <textarea
                ref={addTextAreaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => handleKeyDownNew(e, type)}
                onBlur={() => handleSaveNew(type)}
                placeholder="Scrivi..."
                className={`
                  w-full h-full resize-none outline-none text-center bg-transparent text-[11px] font-bold custom-scrollbar
                  ${themeColor === 'green' ? 'text-green-900 placeholder-green-300' : 'text-red-900 placeholder-red-300'}
                `}
              />
            </div>
          )}

        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-8 gap-6 w-full">
      {renderEventSection('Cose Positive', 'EP', positiveEvents, 'green')}
      {renderEventSection('Cose Negative', 'EN', negativeEvents, 'red')}
    </div>
  );
};

export default MoodEventsBoard;