import React from 'react';
import type { CatalogOption } from '../../../types/shopping';
import {
  shoppingButtonPrimaryClass,
  shoppingInputClass,
} from './shoppingUi';

interface ShoppingQuickAddBarProps {
  activeListId: string;
  unitOptions: CatalogOption[];
  quickName: string;
  quickQuantity: string;
  quickUnitId: string;
  loading?: boolean;
  onQuickNameChange: (value: string) => void;
  onQuickQuantityChange: (value: string) => void;
  onQuickUnitChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const ShoppingQuickAddBar: React.FC<ShoppingQuickAddBarProps> = ({
  activeListId,
  unitOptions,
  quickName,
  quickQuantity,
  quickUnitId,
  loading = false,
  onQuickNameChange,
  onQuickQuantityChange,
  onQuickUnitChange,
  onSubmit,
}) => {
  const disabled = !activeListId || !quickName.trim() || loading;

  return (
    <form
      onSubmit={onSubmit}
      className="shrink-0 rounded-2xl border border-gray-200 bg-gray-50 p-2"
    >
      <div className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_110px_150px_auto]">
        <input
          type="text"
          className={shoppingInputClass}
          placeholder={
            activeListId
              ? 'Aggiungi rapidamente un articolo...'
              : 'Seleziona prima una lista'
          }
          value={quickName}
          onChange={(e) => onQuickNameChange(e.target.value)}
          disabled={!activeListId || loading}
        />

        <input
          type="number"
          min="0"
          step="0.01"
          className={shoppingInputClass}
          placeholder="Qtà"
          value={quickQuantity}
          onChange={(e) => onQuickQuantityChange(e.target.value)}
          disabled={!activeListId || loading}
        />

        <select
          className={shoppingInputClass}
          value={quickUnitId}
          onChange={(e) => onQuickUnitChange(e.target.value)}
          disabled={!activeListId || loading}
        >
          <option value="">Unità</option>
          {unitOptions.map((option) => (
            <option key={option.code_value} value={String(option.id)}>
              {option.code_name}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className={`${shoppingButtonPrimaryClass} whitespace-nowrap text-xs`}
          disabled={disabled}
        >
          + Aggiungi
        </button>
      </div>
    </form>
  );
};

export default ShoppingQuickAddBar;