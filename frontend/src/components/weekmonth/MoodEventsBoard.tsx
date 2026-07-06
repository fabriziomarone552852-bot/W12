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
  const [addingType, setAddingType] = useState<MoodEventType | null>(null);
  const [inputValue, setInputValue] = useState<string>('');
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const [hoveredSection, setHoveredSection] = useState<MoodEventType | null>(null);

  const addTextAreaRef = useRef<HTMLTextAreaElement>(null);
  const editTextAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (addingType && addTextAreaRef.current) {
      addTextAreaRef.current.focus();
    }
  }, [addingType]);

  useEffect(() => {
    if (editingId && editTextAreaRef.current) {
      editTextAreaRef.current.focus();
      editTextAreaRef.current.selectionStart = editTextAreaRef.current.value.length;
    }
  }, [editingId]);

  const handleSaveNew = (type: MoodEventType) => {
    const trimmedVal = inputValue.trim();
    if (trimmedVal) onAddMoodEvent(type, trimmedVal);
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

  const handleStartEdit = (ev: MoodEvent) => {
    setAddingType(null); 
    setEditingId(ev.id);
    setEditValue(ev.title);
  };

  const handleSaveEdit = () => {
    const trimmedVal = editValue.trim();
    if (trimmedVal && editingId !== null) {
      onUpdateMoodEvent(editingId, trimmedVal);
    } else if (!trimmedVal && editingId !== null) {
      onDeleteMoodEvent(editingId);
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

  const renderEventSection = (
    title: string,
    type: MoodEventType,
    events: MoodEvent[],
    themeColor: 'green' | 'red'
  ) => {
    const limitedEvents = events.slice(0, 9);
    const isAddingHere = addingType === type;
    const isEditingHere = events.some(ev => ev.id === editingId);
    const isSectionActive = hoveredSection === type || isAddingHere || isEditingHere;
    
    const showAddBlock = hoveredSection === type || isAddingHere || limitedEvents.length === 0;
    const hasRoomForMore = limitedEvents.length < 9;
    const totalBlocks = (showAddBlock && hasRoomForMore) ? limitedEvents.length + 1 : limitedEvents.length;

    // Calcolo delle righe/colonne per determinare i bordi dinamici
    const getGridClasses = (count: number) => {
      if (count === 1) return 'grid-cols-1 grid-rows-1';
      if (count === 2) return 'grid-cols-2 grid-rows-1';
      if (count === 3) return 'grid-cols-3 grid-rows-1';
      if (count === 4) return 'grid-cols-2 grid-rows-2';
      if (count === 5 || count === 6) return 'grid-cols-3 grid-rows-2';
      return 'grid-cols-3 grid-rows-3'; 
    };

    const getNumCols = (count: number) => {
      if (count === 1) return 1;
      if (count === 2 || count === 4) return 2;
      return 3;
    };

    // MAGIA CSS: Riconosce se un elemento è su un bordo esterno e cambia l'origine dell'espansione
    const getOriginClass = (index: number, cols: number) => {
      if (cols <= 1) return 'origin-bottom';
      const colIndex = index % cols;
      if (colIndex === 0) return 'origin-bottom-left'; // Elemento tutto a sinistra, si espande verso destra
      if (colIndex === cols - 1) return 'origin-bottom-right'; // Elemento tutto a destra, si espande verso sinistra
      return 'origin-bottom'; // Elemento centrale, si espande ai lati
    };

    const numCols = getNumCols(totalBlocks);
    const [primaParola, secondaParola] = title.split(' ');
    const textStyle = "text-[length:clamp(0.85rem,10cqmin,1.15rem)] font-black leading-tight break-words whitespace-pre-wrap w-full min-w-0 max-w-full";

    return (
      <div 
        className={`relative col-span-4 grid grid-cols-4 bg-white rounded-xl shadow-sm border border-gray-200 h-48 transition-all duration-300 ${isSectionActive ? 'z-50' : 'z-10'}`}
        onMouseEnter={() => setHoveredSection(type)}
        onMouseLeave={() => setHoveredSection(null)}
      >
        <div className={`col-span-1 flex flex-col items-center justify-center text-center p-3`}>
          <h3 className={`flex flex-col text-base sm:text-lg font-black tracking-wider uppercase w-full select-none ${themeColor === 'green' ? 'text-green-600' : 'text-red-600'}`}>
            <span>{primaParola}</span>
            <span>{secondaParola}</span>
          </h3>
        </div>

        <div className={`col-span-3 p-2 grid gap-2 transition-all duration-500 ease-in-out ${getGridClasses(totalBlocks)}`}>
          
          {limitedEvents.map((ev, index) => {
            const isEditingThis = editingId === ev.id;
            const originClass = getOriginClass(index, numCols);
            
            return (
              <div key={ev.id} className={`relative w-full h-full @container ${isEditingThis ? 'z-50' : 'group z-10 hover:z-50'}`}>
                
                <div
                  onClick={() => { if (!isEditingThis) handleStartEdit(ev); }}
                  className={`
                    absolute bottom-0 left-0 right-0 flex flex-col justify-center items-center text-center rounded-lg border transition-all duration-300 ease-out w-full min-h-full ${originClass}
                    ${isEditingThis 
                      ? `h-auto max-h-[250px] overflow-y-auto custom-scrollbar z-50 shadow-2xl scale-[1.30] p-4 ${themeColor === 'green' ? 'bg-green-50 border-green-400 text-green-900' : 'bg-red-50 border-red-400 text-red-900'}`
                      : `overflow-hidden shadow-sm group-hover:h-auto group-hover:max-h-[250px] group-hover:overflow-y-auto group-hover:custom-scrollbar group-hover:z-50 group-hover:shadow-2xl group-hover:scale-[1.30] group-hover:p-4 ${themeColor === 'green' ? 'bg-green-100 border-green-200 text-green-900 hover:bg-green-50' : 'bg-red-100 border-red-200 text-red-900 hover:bg-red-50'}`
                    }
                  `}
                >
                  {!isEditingThis && (
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        onDeleteMoodEvent(ev.id); 
                      }} 
                      className={`absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full z-10 ${themeColor === 'green' ? 'bg-green-200/70 text-green-700 hover:bg-red-200 hover:text-red-800' : 'bg-red-200/70 text-red-700 hover:bg-red-300 hover:text-red-900'}`}
                      title="Elimina"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <div className="w-full flex flex-col items-center justify-center min-w-0 flex-1">
                    {isEditingThis ? (
                      <div className="relative w-full grid place-items-center min-w-0">
                        <div className={`${textStyle} invisible col-start-1 row-start-1 w-full pointer-events-none`}>
                          {editValue + ' '}
                        </div>
                        <textarea
                          ref={editTextAreaRef}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={handleKeyDownEdit}
                          onBlur={handleSaveEdit}
                          className={`col-start-1 row-start-1 w-full h-full resize-none overflow-hidden outline-none text-center bg-transparent ${textStyle}`}
                        />
                      </div>
                    ) : (
                      <span className={`${textStyle} line-clamp-3 group-hover:line-clamp-none`}>
                        {ev.title}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* AREA NUOVO EVENTO */}
          {showAddBlock && hasRoomForMore && (
            <div className={`relative w-full h-full @container ${isAddingHere ? 'z-50' : 'group z-10 hover:z-50'}`}>
              {isAddingHere ? (
                <div className={`
                  absolute bottom-0 left-0 right-0 flex flex-col justify-center items-center text-center rounded-lg border-2 shadow-2xl transition-all duration-300 ease-out w-full min-h-full h-auto max-h-[250px] overflow-y-auto custom-scrollbar z-50 scale-[1.30] p-4 ${getOriginClass(limitedEvents.length, numCols)}
                  ${themeColor === 'green' ? 'bg-green-50 border-green-400 text-green-900' : 'bg-red-50 border-red-400 text-red-900'}
                `}>
                  <div className="w-full flex flex-col items-center justify-center min-w-0 flex-1">
                    <div className="relative w-full grid place-items-center min-w-0">
                      <div className={`${textStyle} invisible col-start-1 row-start-1 w-full pointer-events-none`}>
                        {inputValue + ' '}
                      </div>
                      <textarea
                        ref={addTextAreaRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => handleKeyDownNew(e, type)}
                        onBlur={() => handleSaveNew(type)}
                        placeholder="Scrivi..."
                        className={`col-start-1 row-start-1 w-full h-full resize-none overflow-hidden outline-none text-center bg-transparent ${textStyle} ${themeColor === 'green' ? 'placeholder-green-300' : 'placeholder-red-300'}`}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center transition-all duration-500 z-10">
                  <button
                    onClick={() => {
                      setEditingId(null);
                      setAddingType(type);
                    }}
                    className={`w-full h-full flex items-center justify-center rounded-lg border-2 border-dashed transition-all duration-300 outline-none group-hover:scale-[1.05] active:scale-95 ${themeColor === 'green' ? 'border-green-300 text-green-400 hover:bg-green-50 hover:text-green-600' : 'border-red-300 text-red-400 hover:bg-red-50 hover:text-red-600'}`}
                  >
                    <PlusIcon className="w-6 h-6 animate-pulse" />
                  </button>
                </div>
              )}
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