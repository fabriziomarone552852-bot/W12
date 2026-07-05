// src/components/shared/shopping/ShoppingItemEditModal.tsx
import React from 'react';
import type { CatalogOption, ItemFormState, ShoppingListItem } from '../../../types/shopping';
import {
  shoppingButtonPrimaryClass,
  shoppingButtonSecondaryClass,
  shoppingCardClass,
  shoppingInputClass,
} from './shoppingUi';
import { renderCatalogOptions } from './shoppingItems.utils';

interface ShoppingItemEditModalProps {
  isOpen: boolean;
  item: ShoppingListItem | null;
  form: ItemFormState;
  unitOptions: CatalogOption[];
  itemStatusOptions: CatalogOption[];
  onChange: React.Dispatch<React.SetStateAction<ItemFormState>>;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

const ShoppingItemEditModal: React.FC<ShoppingItemEditModalProps> = ({
  isOpen,
  item,
  form,
  unitOptions,
  itemStatusOptions,
  onChange,
  onClose,
  onSubmit,
}) => {
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm">
      <div className={`${shoppingCardClass} w-full max-w-md p-5`}>
        <h2 className="mb-4 text-lg font-bold text-gray-900">Modifica articolo</h2>

        <form onSubmit={onSubmit} className="space-y-3">
          <input
            className={shoppingInputClass}
            placeholder="Nome"
            value={form.name_original}
            onChange={(e) =>
              onChange((prev) => ({
                ...prev,
                name_original: e.target.value,
              }))
            }
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              step="any"
              className={shoppingInputClass}
              placeholder="Quantità"
              value={form.quantity}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  quantity: e.target.value,
                }))
              }
            />

            <select
              className={shoppingInputClass}
              value={form.unit_id}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  unit_id: e.target.value,
                }))
              }
            >
              <option value="">Nessuna unità</option>
              {renderCatalogOptions(unitOptions)}
            </select>
          </div>

          <input
            className={shoppingInputClass}
            placeholder="Note"
            value={form.notes}
            onChange={(e) =>
              onChange((prev) => ({
                ...prev,
                notes: e.target.value,
              }))
            }
          />

          <select
            className={shoppingInputClass}
            value={form.status_id}
            onChange={(e) =>
              onChange((prev) => ({
                ...prev,
                status_id: e.target.value,
              }))
            }
          >
            <option value="">Default backend</option>
            {renderCatalogOptions(itemStatusOptions)}
          </select>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={shoppingButtonSecondaryClass}
            >
              Annulla
            </button>
            <button type="submit" className={shoppingButtonPrimaryClass}>
              Salva
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShoppingItemEditModal;