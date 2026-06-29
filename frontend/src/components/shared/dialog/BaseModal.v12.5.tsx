// src/components/shared/dialog/BaseModal.tsx
import React, { type ReactNode } from 'react';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode; 
  children: ReactNode;
  footer?: ReactNode;
  maxWidthClass?: string;
  sidePanel?: ReactNode;
  headerActions?: ReactNode; 
  hideDefaultClose?: boolean; 
}

const BaseModal: React.FC<BaseModalProps> = ({ 
  isOpen, onClose, title, children, footer, maxWidthClass = 'max-w-md', sidePanel, headerActions, hideDefaultClose = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 pointer-events-auto" onClick={onClose}>
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
          
          {/* HEADER in BaseModal.tsx */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl shrink-0">
          
          <h3 className="text-lg font-extrabold text-gray-800 uppercase tracking-wider">
            {title}
          </h3>
          
          <div className="flex items-center gap-1">
            {/* 1. Stampiamo Modifica ed Elimina (se passati dal componente) */}
            {headerActions}
            
            {/* 2. Se abbiamo stampato le azioni, aggiungiamo una barretta di separazione */}
            {headerActions && <div className="w-px h-5 bg-gray-300 mx-1"></div>}

            {/* 3. La X FISSA, gestita centralmente! */}
            <button type="button" onClick={onClose} className="p-1.5 text-gray-400 hover:bg-gray-200 hover:text-red-500 rounded-lg transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

        </div>

          <div className="p-6 overflow-y-auto custom-scrollbar">{children}</div>

          {footer && <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl shrink-0">{footer}</div>}
        </div>
      </div>
    </div>
  );
};

export default BaseModal;