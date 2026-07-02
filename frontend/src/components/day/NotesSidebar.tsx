// src/components/day/NotesSidebar.tsx
import React, { useState, useEffect } from 'react';
import type { NoteItem } from '@/types';
import { CloseIcon, TrashIcon, PlusIcon, NoteIcon } from '@/components/shared/utils/Icons';
import { useAutoResizeTextArea } from '@/hooks/useAutoResizeTextArea';
import { useDebounce } from '@/hooks/useDebounce';

// --- MICRO-COMPONENTE INTELLIGENTE (SMART COMPONENT) ---
const SmartNoteCard: React.FC<{
  nota: NoteItem;
  isInitiallyEditing: boolean;
  onAutoSave: (id: number, text: string, isNew?: boolean) => void;
  onDelete: (id: number, isNew?: boolean) => void;
  clearNewStatus: () => void; // Serve per dire "Ok, sto scrivendo, non è più 'nuova'"
}> = ({ nota, isInitiallyEditing, onAutoSave, onDelete, clearNewStatus }) => {
  // Lo stato del testo vive SOLO qui dentro. La digitazione è fulminea!
  const [isEditing, setIsEditing] = useState(isInitiallyEditing);
  const [text, setText] = useState(nota.text);
  
  // Il Debounce aspetta 1 secondo (1000ms) dall'ultima battuta sulla tastiera
  const debouncedText = useDebounce(text, 1000);
  const textareaRef = useAutoResizeTextArea(text);

  // LA MAGIA DELL'AUTO-SAVE
  useEffect(() => {
    // Se il testo è cambiato rispetto all'originale
    if (debouncedText !== nota.text) {
      if (debouncedText.trim() === "") {
        onDelete(nota.id, nota.isNew);
      } else {
        onAutoSave(nota.id, debouncedText, nota.isNew);
        clearNewStatus(); // Togliamo il flag isNew per non creare cloni
      }
    }
  }, [debouncedText]); // Non mettiamo nota.text nelle dipendenze per evitare loop

  const handleBlur = () => {
    setIsEditing(false);
    // Se esce sùbito dall'input senza aspettare il secondo del debounce:
    if (text.trim() === "") {
      onDelete(nota.id, nota.isNew);
    } else if (text !== nota.text) {
      onAutoSave(nota.id, text, nota.isNew);
      clearNewStatus();
    }
  };

  return (
    <div 
      onClick={() => { if (!isEditing) setIsEditing(true); }} 
      className={`p-4 rounded-br-2xl rounded-tl-lg rounded-tr-lg rounded-bl-lg shadow-md relative group min-h-[5rem] transition-colors ${nota.color} ${isEditing ? 'cursor-text ring-2 ring-yellow-400/50' : 'cursor-pointer hover:shadow-lg'}`}
    >
      <div className="absolute bottom-0 right-0 w-4 h-4 bg-black/10 rounded-tl-lg rounded-br-2xl pointer-events-none"></div>
      
      {/* Bottone elimina protetto per non far partire l'edit mode */}
      <button 
        onClick={(e) => { e.stopPropagation(); onDelete(nota.id, nota.isNew); }} 
        className="absolute top-2 right-2 text-yellow-800/40 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full bg-yellow-300/30 hover:bg-yellow-300/80 z-10" 
        title="Elimina nota"
      >
        <TrashIcon className="w-4 h-4" />
      </button>

      {isEditing ? (
        <textarea
          ref={textareaRef}
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={(e) => e.target.setSelectionRange(e.target.value.length, e.target.value.length)}
          onBlur={handleBlur}
          placeholder="Scrivi qui la tua nota..."
          className="w-full bg-transparent border-none focus:ring-0 resize-none outline-none text-sm font-medium leading-relaxed font-mono placeholder-yellow-800/40 p-0 overflow-hidden pr-6 custom-scrollbar"
          rows={1}
        />
      ) : (
        <p className="text-sm font-medium leading-relaxed font-mono whitespace-pre-wrap break-words pr-6">
          {text || <span className="text-yellow-800/40 italic">Nota vuota... Clicca per scrivere.</span>}
        </p>
      )}
    </div>
  );
};

interface NotesSidebarProps {
  isOpen: boolean;
  notes: NoteItem[];
  editingNoteId: number | null;
  onOpen: () => void;
  onClose: () => void;
  onAddNote: () => void;
  // Guarda come si sono semplificate le prop!
  onAutoSaveNote: (id: number, text: string, isNew?: boolean) => void;
  onDeleteNote: (id: number, isNew?: boolean) => void;
  clearEditingNoteId: () => void;
}

const NotesSidebar: React.FC<NotesSidebarProps> = ({ 
  isOpen, notes, editingNoteId, onOpen, onClose, onAddNote, onAutoSaveNote, onDeleteNote, clearEditingNoteId 
}) => {
  return (
    <>
      <div onClick={onOpen} className="fixed right-0 top-1/2 -translate-y-1/2 translate-x-8 hover:translate-x-0 w-20 hover:w-28 h-14 bg-[#fde047] hover:bg-[#facc15] text-yellow-900 rounded-l-2xl shadow-[-5px_0_15px_rgba(0,0,0,0.1)] flex items-center justify-start pl-3 cursor-pointer transition-all duration-300 z-30 border border-y-yellow-300 border-l-yellow-300 group">
        <NoteIcon className="w-6 h-6" />
        <span className="ml-2 font-black text-sm uppercase opacity-0 group-hover:opacity-100 transition-opacity delay-100">Note</span>
      </div>

      <div className={`fixed top-0 right-0 h-full w-96 bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.1)] z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
            <NoteIcon className="w-5 h-5 text-yellow-500" />
            Note
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">
            <CloseIcon />
          </button>
        </div>
        
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-gray-50/50 custom-scrollbar">
          <button onClick={onAddNote} className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 active:scale-95 active:bg-blue-100 transition-all flex justify-center items-center font-bold text-sm gap-2">
            <PlusIcon />
            Nuova Nota
          </button>

          {notes.map(nota => (
            <SmartNoteCard 
              key={nota.id}
              nota={nota}
              isInitiallyEditing={editingNoteId === nota.id}
              onAutoSave={onAutoSaveNote}
              onDelete={onDeleteNote}
              clearNewStatus={clearEditingNoteId}
            />
          ))}
        </div>
      </div>
      {isOpen && <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity" onClick={onClose}></div>}
    </>
  );
};

export default NotesSidebar;