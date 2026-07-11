import React, { useState } from 'react';
import { TrashIcon } from '@/components/shared/utils/Icons';
import type { MoodEvent } from '@/types/dailyentries';
import { getOriginClass, getNumCols } from '@/utils/uiUtils';
import { AutoExpandingTextarea } from '@/components/shared/utils/AutoExpandingTextarea';

// Lo stile testo lo possiamo condividere o esportare da un file uiUtils.ts
const textStyle = "text-[length:clamp(0.85rem,10cqmin,1.15rem)] font-black leading-tight break-words whitespace-pre-wrap w-full min-w-0 max-w-full";

interface MoodEventCardProps {
  ev: MoodEvent;
  index: number;
  totalBlocks: number;
  themeColor: 'green' | 'red';
  isEditing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: (id: number, newTitle: string) => void;
  onDelete: (id: number) => void;
}

export const MoodEventCard: React.FC<MoodEventCardProps> = ({
  ev, index, totalBlocks, themeColor, isEditing, onStartEdit, onCancelEdit, onSave, onDelete
}) => {
  const originClass = getOriginClass(index, getNumCols(totalBlocks));
  
  const colors = themeColor === 'green' 
    ? { bgHover: 'hover:bg-green-50', bgIdle: 'bg-green-100', border: 'border-green-200', text: 'text-green-900', editingBg: 'bg-green-50 border-green-400', trashBtn: 'bg-green-200/70 text-green-700 hover:bg-red-200 hover:text-red-800' }
    : { bgHover: 'hover:bg-red-50', bgIdle: 'bg-red-100', border: 'border-red-200', text: 'text-red-900', editingBg: 'bg-red-50 border-red-400', trashBtn: 'bg-red-200/70 text-red-700 hover:bg-red-300 hover:text-red-900' };

  const handleSave = (newVal: string) => {
    const trimmedVal = newVal.trim();
    if (trimmedVal) onSave(ev.id, trimmedVal);
    else onDelete(ev.id);
  };

  return (
    <div className={`relative w-full h-full @container ${isEditing ? 'z-50' : 'group z-10 hover:z-50'}`}>
      <div
        onClick={() => { if (!isEditing) onStartEdit(); }}
        className={`absolute bottom-0 left-0 right-0 flex flex-col justify-center items-center text-center rounded-lg border transition-all duration-300 ease-out w-full min-h-full ${originClass} 
          ${isEditing 
            ? `h-auto max-h-[250px] overflow-y-auto custom-scrollbar shadow-2xl scale-[1.30] p-4 ${colors.editingBg} ${colors.text}`
            : `overflow-hidden shadow-sm group-hover:h-auto group-hover:max-h-[250px] group-hover:overflow-y-auto group-hover:custom-scrollbar group-hover:shadow-2xl group-hover:scale-[1.30] group-hover:p-4 ${colors.bgIdle} ${colors.border} ${colors.text} ${colors.bgHover}`
          }
        `}
      >
        {!isEditing && (
          <button 
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); onDelete(ev.id); }} 
            className={`absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full z-10 ${colors.trashBtn}`}
            title="Elimina"
          >
            <TrashIcon className="w-3.5 h-3.5" />
          </button>
        )}

        <div className="w-full flex flex-col items-center justify-center min-w-0 flex-1">
          {isEditing ? (
            <AutoExpandingTextarea 
              initialValue={ev.title}
              onBlur={(e) => handleSave(e.target.value)} 
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSave(e.currentTarget.value); }
                if (e.key === 'Escape') onCancelEdit();
              }}
              themeColor={themeColor}
              autoFocus
            />
          ) : (
            <span className={`${textStyle} line-clamp-3 group-hover:line-clamp-none`}>
              {ev.title}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};