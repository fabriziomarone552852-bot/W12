// src/components/shared/dialog/BaseModal.tsx
import React, { type ReactNode } from 'react';
import { CloseIcon, LoadingIcon } from '../utils/Icons';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode; 
  children: ReactNode;
  footer?: ReactNode; // Manteniamo per retrocompatibilità o per footer molto custom
  maxWidthClass?: string;
  sidePanel?: ReactNode;
  headerActions?: ReactNode; 
  hideDefaultClose?: boolean; 
  
  // --- NUOVE PROPS MAGICHE PER IL FOOTER AUTOMATICO ---
  onConfirm?: (e?: React.MouseEvent) => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  isConfirmDisabled?: boolean;
  formId?: string; // Se il modal contiene un form e il bottone deve fare il submit

  isLoading?: boolean;
}

const BaseModal: React.FC<BaseModalProps> = ({ 
  isOpen, onClose, title, children, footer, maxWidthClass = 'max-w-md', 
  sidePanel, headerActions, hideDefaultClose = false,
  onConfirm, onCancel, confirmText = 'Salva', cancelText = 'Annulla', 
  isConfirmDisabled = false, formId,
  isLoading = false
}) => {
  if (!isOpen) return null;

  // Funzione che decide quale footer mostrare
  const renderFooter = () => {
    if (footer) return footer; // Se passi un footer custom, vince lui
    
    // Generiamo il footer standard se ci sono onConfirm o formId
    if (onConfirm || formId) {
      return (
        <div className="flex justify-end gap-3 w-full">
          <button 
            type="button" 
            onClick={onCancel || onClose} 
            disabled={isLoading} // Disabilita l'annulla se sta caricando
            className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors shadow-sm"
          >
            {cancelText}
          </button>
          <button 
            type={formId ? "submit" : "button"} 
            form={formId}
            onClick={!formId ? onConfirm : undefined} 
            disabled={isConfirmDisabled || isLoading} // Disabilita il salva se sta caricando
            className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
              {confirmText}
          </button>
        </div>
      );
    }
    return null;
  };

  const activeFooter = renderFooter();

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 pointer-events-auto" onClick={!isLoading ? onClose : undefined}>
      <div className="flex gap-4 items-start w-full max-w-5xl justify-center pointer-events-none">
        
        {sidePanel && (
           <div 
             className="pointer-events-auto flex-shrink-0 w-full max-w-md"
             onClick={(e) => e.stopPropagation()} 
           >
             {sidePanel}
           </div>
        )}

        <div className={`bg-white rounded-2xl shadow-2xl w-full ${maxWidthClass} transform transition-all animate-fadeIn relative flex flex-col max-h-[90vh] pointer-events-auto shrink-0`} onClick={(e) => e.stopPropagation()}>
          
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl shrink-0">
            <h3 className="text-lg font-extrabold text-gray-800 uppercase tracking-wider">
              {title}
            </h3>
            
            <div className="flex items-center gap-1">
              {headerActions}
              {headerActions && <div className="w-px h-5 bg-gray-300 mx-1"></div>}
              {!hideDefaultClose && (
                <button type="button" disabled={isConfirmDisabled || isLoading} onClick={onClose} className={`p-1.5 rounded-lg transition-colors ${isLoading ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:bg-gray-200 hover:text-red-500'}`}>
                  <CloseIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar">{children}</div>

          {activeFooter && <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl shrink-0">{activeFooter}</div>}
          
          {isLoading && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/60 backdrop-blur-[2px] rounded-2xl animate-fadeIn">
              <div className="bg-white p-4 rounded-full shadow-lg mb-3">
                <LoadingIcon className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
              <span className="text-sm font-extrabold text-blue-900 tracking-widest uppercase drop-shadow-sm">
                Salvataggio...
              </span>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default BaseModal;