import React, { useState } from 'react';
import { PlusIcon } from '@/components/shared/utils/Icons';
import type { MoodEvent, MoodEventType } from '@/types/dailyentries';
import { getGridClasses, getOriginClass, getNumCols } from '@/utils/uiUtils';
import { AutoExpandingTextarea } from '@/components/shared/utils/AutoExpandingTextarea';
import { MoodEventCard } from './MoodEventCard';

interface MoodEventColumnProps {
  title: string;
  type: MoodEventType;
  events: MoodEvent[];
  themeColor: 'green' | 'red';
  onAdd: (type: MoodEventType, title: string) => Promise<void> | void; 
  onUpdate: (id: number, newTitle: string) => Promise<void> | void;
  onDelete: (id: number) => void;
  
}

export const MoodEventColumn: React.FC<MoodEventColumnProps> = ({
  title, type, events, themeColor, onAdd, onUpdate, onDelete
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  const limitedEvents = events.slice(0, 9);
  const isEditingHere = events.some(ev => ev.id === editingId);
  const isSectionActive = isHovered || isAdding || isEditingHere;
  
  const showAddBlock = isHovered || isAdding || limitedEvents.length === 0;
  const hasRoomForMore = limitedEvents.length < 9;
  const totalBlocks = (showAddBlock && hasRoomForMore) ? limitedEvents.length + 1 : limitedEvents.length;
  const [primaParola, secondaParola] = title.split(' ');

  const titleColor = themeColor === 'green' ? 'text-green-600' : 'text-red-600';
  const borderTheme = themeColor === 'green' 
    ? 'border-green-300 text-green-400 hover:bg-green-50 hover:text-green-600' 
    : 'border-red-300 text-red-400 hover:bg-red-50 hover:text-red-600';

  const handleSaveNew = async (newVal: string) => {
    const trimmedVal = newVal.trim();
    
    // Se è vuoto, chiudiamo semplicemente
    if (!trimmedVal) {
      setIsAdding(false);
      return;
    }

    // Se stiamo già salvando (es. doppio click rapido), ignoriamo
    if (isSaving) return;

    try {
      setIsSaving(true);
      await onAdd(type, trimmedVal); // Aspettiamo che il DB o lo stato globale si aggiorni!
    } catch (error) {
      console.error("Errore durante il salvataggio", error);
    } finally {
      // Quando ha finito (con successo o errore), sblocca e chiude
      setIsSaving(false);
      setIsAdding(false);
    }
  };

  return (
    <div 
      className={`relative col-span-4 grid grid-cols-4 bg-white rounded-xl shadow-sm border border-gray-200 h-48 transition-all duration-300 ${isSectionActive ? 'z-50' : 'z-10'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="col-span-1 flex flex-col items-center justify-center text-center p-3">
        <h3 className={`flex flex-col text-base sm:text-lg font-black tracking-wider uppercase w-full select-none ${titleColor}`}>
          <span>{primaParola}</span><span>{secondaParola}</span>
        </h3>
      </div>

      <div className={`col-span-3 p-2 grid gap-2 transition-all duration-500 ease-in-out ${getGridClasses(totalBlocks)}`}>
        {limitedEvents.map((ev, index) => (
          <MoodEventCard 
            key={ev.id}
            ev={ev}
            index={index}
            totalBlocks={totalBlocks}
            themeColor={themeColor}
            isEditing={editingId === ev.id}
            onStartEdit={() => { setIsAdding(false); setEditingId(ev.id); }}
            onCancelEdit={() => setEditingId(null)}
            onSave={(id, val) => { onUpdate(id, val); setEditingId(null); }}
            onDelete={onDelete}
          />
        ))}

        {showAddBlock && hasRoomForMore && (
          <div className={`relative w-full h-full @container ${isAdding ? 'z-50' : 'group z-10 hover:z-50'}`}>
            {isAdding ? (
               <div className={`absolute bottom-0 left-0 right-0 flex flex-col justify-center items-center text-center rounded-lg border-2 shadow-2xl transition-all duration-300 ease-out w-full min-h-full h-auto max-h-[250px] overflow-y-auto custom-scrollbar z-50 scale-[1.30] p-4 ${getOriginClass(limitedEvents.length, getNumCols(totalBlocks))} ${themeColor === 'green' ? 'bg-green-50 border-green-400 text-green-900' : 'bg-red-50 border-red-400 text-red-900'}`}>
                 <AutoExpandingTextarea 
                    initialValue="" 
                    onBlur={(e) => handleSaveNew(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveNew(e.currentTarget.value); }
                      if (e.key === 'Escape' && !isSaving) setIsAdding(false);
                    }}
                    placeholder="Scrivi..."
                    themeColor={themeColor}
                    autoFocus
                    disabled={isSaving}
                 />
               </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center transition-all duration-500 z-10">
                <button
                  onClick={() => { setEditingId(null); setIsAdding(true); }}
                  className={`w-full h-full flex items-center justify-center rounded-lg border-2 border-dashed transition-all duration-300 outline-none focus:outline-none focus:ring-0 group-hover:scale-[1.05] active:scale-95 ${borderTheme}`}
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