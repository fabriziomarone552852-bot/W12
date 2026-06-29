// src/components/day/NotesSidebar.tsx
import React, { useRef, useLayoutEffect } from 'react';
import type { NoteItem } from '../../types';
import { CloseIcon, NoteIcon, TrashIcon, PlusIcon } from '../shared/utils/Icons';
import { useAutoResizeTextArea } from '../../hooks/useAutoResizeTextArea';

// --- MICRO-COMPONENTE PER LA SINGOLA NOTA IN MODIFICA ---
const NoteEditor: React.FC<{
  nota: NoteItem;
  onChangeNote: (id: number, text: string) => void;
  onBlurNote: (id: number) => void;
}> = ({ nota, onChangeNote, onBlurNote }) => {
  // Ogni nota ha il suo hook isolato per il resize!
  const textareaRef = useAutoResizeTextArea(nota.text);

  return (
    <textarea
      ref={textareaRef}
      autoFocus
      value={nota.text}
      onChange={(e) => onChangeNote(nota.id, e.target.value)}
      onFocus={(e) => e.target.setSelectionRange(e.target.value.length, e.target.value.length)}
      onBlur={() => onBlurNote(nota.id)}
      placeholder="Scrivi qui la tua nota..."
      className="w-full bg-transparent border-none focus:ring-0 resize-none outline-none text-sm font-medium leading-relaxed font-mono placeholder-yellow-800/40 p-0 overflow-hidden pr-6"
      rows={1}
    />
  );
};

interface NotesSidebarProps {
  isOpen: boolean;
  notes: NoteItem[];
  editingNoteId: number | null;
  onOpen: () => void;
  onClose: () => void;
  onAddNote: () => void;
  onChangeNote: (id: number, text: string) => void;
  onBlurNote: (id: number) => void;
  onRemoveNote: (e: React.MouseEvent, id: number, isNew?: boolean) => void;
  setEditingNoteId: (id: number | null) => void;
}

const NotesSidebar: React.FC<NotesSidebarProps> = ({ isOpen, notes, editingNoteId, onOpen, onClose, onAddNote, onChangeNote, onBlurNote, onRemoveNote, setEditingNoteId }) => {
  
  return (
    <>
      <div onClick={onOpen} className="fixed right-0 top-1/2 -translate-y-1/2 translate-x-8 hover:translate-x-0 w-20 hover:w-28 h-14 bg-[#fde047] hover:bg-[#facc15] text-yellow-900 rounded-l-2xl shadow-[-5px_0_15px_rgba(0,0,0,0.1)] flex items-center justify-start pl-3 cursor-pointer transition-all duration-300 z-30 border border-y-yellow-300 border-l-yellow-300 group">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
        <span className="ml-2 font-black text-sm uppercase opacity-0 group-hover:opacity-100 transition-opacity delay-100">Note</span>
      </div>

      <div className={`fixed top-0 right-0 h-full w-96 bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.1)] z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"/></svg>
            Note
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">
            {/* Sostituito con la nostra Icona centralizzata */}
            <CloseIcon />
          </button>
        </div>
        
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-gray-50/50 custom-scrollbar">
          
          <button onClick={onAddNote} className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 active:scale-95 active:bg-blue-100 transition-all flex justify-center items-center font-bold text-sm gap-2">
             {/* Sostituito con la nostra Icona centralizzata */}
            <PlusIcon />
            Nuova Nota
          </button>

          {notes.map(nota => (
            <div key={nota.id} onClick={() => { if (editingNoteId !== nota.id) setEditingNoteId(nota.id); }} className={`p-4 rounded-br-2xl rounded-tl-lg rounded-tr-lg rounded-bl-lg shadow-md relative group cursor-text min-h-[5rem] transition-colors ${nota.color}`}>
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-black/10 rounded-tl-lg rounded-br-2xl pointer-events-none"></div>
              
              <button onClick={(e) => onRemoveNote(e, nota.id, nota.isNew)} className="absolute top-2 right-2 text-yellow-800/40 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full bg-yellow-300/30 hover:bg-yellow-300/80 z-10" title="Elimina nota">
                {/* Sostituito con la nostra Icona centralizzata (piccolina) */}
                <TrashIcon className="w-4 h-4" />
              </button>

              {editingNoteId === nota.id ? (
                /* Richiamo il micro-componente pulitissimo */
                <NoteEditor 
                  nota={nota} 
                  onChangeNote={onChangeNote} 
                  onBlurNote={onBlurNote} 
                />
              ) : (
                <p className="text-sm font-medium leading-relaxed font-mono whitespace-pre-wrap break-words pr-6">
                  {nota.text || <span className="text-yellow-800/40 italic">Nota vuota... Clicca per scrivere.</span>}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
      {isOpen && <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity" onClick={onClose}></div>}
    </>
  );
};

export default NotesSidebar;