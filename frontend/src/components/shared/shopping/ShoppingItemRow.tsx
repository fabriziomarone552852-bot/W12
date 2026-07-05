// src/components/shared/shopping/ShoppingItemRow.tsx
import React from 'react';
import type { ShoppingListItem } from '../../../types/shopping';
import { shoppingCardClass } from './shoppingUi';

interface ShoppingItemRowProps {
  item: ShoppingListItem;
  onToggle: (item: ShoppingListItem) => void;
  onEdit: (item: ShoppingListItem) => void;
  onDelete: (item: ShoppingListItem) => void;
}

const ShoppingItemRow: React.FC<ShoppingItemRowProps> = ({
  item,
  onToggle,
  onEdit,
  onDelete,
}) => {
  return (
    <div className={`${shoppingCardClass} flex items-center gap-2 p-2.5`}>
      <button
        type="button"
        onClick={() => onToggle(item)}
        className={`h-5 w-5 shrink-0 rounded-full border-2 transition ${
          item.is_purchased
            ? 'border-green-500 bg-green-500'
            : 'border-gray-300 hover:border-green-400'
        }`}
        aria-label={
          item.is_purchased
            ? `Segna ${item.name_original} come non acquistato`
            : `Segna ${item.name_original} come acquistato`
        }
      >
        {item.is_purchased && (
          <span className="flex items-center justify-center text-xs text-white">
            ✓
          </span>
        )}
      </button>

      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm ${
            item.is_purchased
              ? 'text-gray-400 line-through'
              : 'text-gray-800'
          }`}
        >
          {item.name_original}
        </p>
        {item.notes && (
          <p className="truncate text-xs text-gray-400">{item.notes}</p>
        )}
      </div>

      <div className="shrink-0 flex items-center gap-1">
        <button
          type="button"
          onClick={() => onEdit(item)}
          className="text-xs text-gray-400 hover:text-blue-500"
          aria-label={`Modifica ${item.name_original}`}
        >
          ✎
        </button>
        <button
          type="button"
          onClick={() => onDelete(item)}
          className="text-xs text-gray-400 hover:text-red-500"
          aria-label={`Elimina ${item.name_original}`}
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default ShoppingItemRow;