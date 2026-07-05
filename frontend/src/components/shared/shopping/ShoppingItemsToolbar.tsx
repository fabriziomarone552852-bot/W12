// src/components/shared/shopping/ShoppingItemsToolbar.tsx
import React from 'react';
import {
  shoppingButtonPrimaryClass,
  shoppingInputClass,
} from './shoppingUi';

interface ShoppingItemsToolbarProps {
  currentListName: string;
  activeListId: string;
  filtroNome: string;
  filtroStato: 'tutti' | 'aperti' | 'completati';
  onFiltroNomeChange: (value: string) => void;
  onFiltroStatoChange: (value: 'tutti' | 'aperti' | 'completati') => void;
  onAddItem: () => void;
}

const ShoppingItemsToolbar: React.FC<ShoppingItemsToolbarProps> = ({
  currentListName,
  activeListId,
  filtroNome,
  filtroStato,
  onFiltroNomeChange,
  onFiltroStatoChange,
  onAddItem,
}) => {
  return (
    <>
      <div className="shrink-0 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700">
          {currentListName}
        </h2>
        <button
          type="button"
          onClick={onAddItem}
          className={`${shoppingButtonPrimaryClass} text-xs`}
        //  disabled={!activeListId}
        >
          + Articolo
        </button>
      </div>

      <div className="shrink-0 flex gap-2">
        <input
          className={`${shoppingInputClass} flex-1`}
          placeholder="Cerca..."
          value={filtroNome}
          onChange={(e) => onFiltroNomeChange(e.target.value)}
        />
        <select
          className={`${shoppingInputClass} w-32`}
          value={filtroStato}
          onChange={(e) =>
            onFiltroStatoChange(e.target.value as 'tutti' | 'aperti' | 'completati')
          }
        >
          <option value="tutti">Tutti</option>
          <option value="aperti">Aperti</option>
          <option value="completati">Completati</option>
        </select>
      </div>
    </>
  );
};

export default ShoppingItemsToolbar;