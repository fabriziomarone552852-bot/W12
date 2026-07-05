// src/components/shared/shopping/ShoppingItemsList.tsx
import React from 'react';
import type { ShoppingListItem } from '../../../types/shopping';
import ShoppingItemRow from './ShoppingItemRow';

interface ShoppingItemsListProps {
  loading: boolean;
  items: ShoppingListItem[];
  containerRef: React.RefObject<HTMLDivElement>;
  onToggle: (item: ShoppingListItem) => void;
  onEdit: (item: ShoppingListItem) => void;
  onDelete: (itemId: number) => void;
}

const ShoppingItemsList: React.FC<ShoppingItemsListProps> = ({
  loading,
  items,
  containerRef,
  onToggle,
  onEdit,
  onDelete,
}) => {
  return (
    <div
      ref={containerRef}
      className="flex h-full min-h-0 flex-col overflow-hidden"
    >
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2">
        {loading ? (
          <p className="py-4 text-center text-xs text-gray-400">Caricamento...</p>
        ) : items.length === 0 ? (
          <p className="py-4 text-center text-xs text-gray-400">Nessun articolo.</p>
        ) : (
          <div className="space-y-1.5">
            {items.map((item) => (
              <ShoppingItemRow
                key={item.id}
                item={item}
                onToggle={onToggle}
                onEdit={onEdit}
                onDelete={() => onDelete(item.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShoppingItemsList;