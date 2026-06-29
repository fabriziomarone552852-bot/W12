// src/components/shared/dialog/ConfirmDialog.tsx
import React from 'react';
import { TrashIcon, WarningIcon } from '../utils/Icons';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode; // Permette di passare anche JSX (es. i messaggi con il tag ⚠️)
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean; // Se true, il bottone è rosso (es. Elimina)
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen, title, message, confirmText = 'Conferma', cancelText = 'Annulla', onConfirm, onCancel, isDestructive = true
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center z-[70] p-4 pointer-events-auto"
      onClick={(e) => { e.stopPropagation(); onCancel(); }}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center animate-fadeIn transform transition-all scale-100" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4 ${isDestructive ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
          {isDestructive ? (
            <TrashIcon className="w-6 h-6" />
          ) : (
            <WarningIcon className="w-6 h-6" />
          )}
        </div>
        <h3 className="text-lg font-extrabold text-gray-900 mb-2">{title}</h3>
        <div className="text-sm text-gray-600 mb-6">{message}</div>
        <div className="flex gap-3">
          <button type="button" onClick={onCancel} className="flex-1 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl font-bold text-sm transition-colors">
            {cancelText}
          </button>
          <button type="button" onClick={onConfirm} className={`flex-1 py-2 text-white rounded-xl font-bold text-sm transition-colors ${isDestructive ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;