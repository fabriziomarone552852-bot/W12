// src/components/shared/shopping/ShoppingItemCreateModal.tsx
import React from 'react';
import type { CatalogOption, ItemFormState, ShoppingList } from '../../../types/shopping';
import {
  shoppingButtonPrimaryClass,
  shoppingButtonSecondaryClass,
  shoppingInputClass,
} from './shoppingUi';
import { renderCatalogOptions } from './shoppingItems.utils';

interface ShoppingItemCreateModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  itemForm: ItemFormState;
  setItemForm: React.Dispatch<React.SetStateAction<ItemFormState>>;
  activeListId: string;
  lists: ShoppingList[];
  unitOptions: CatalogOption[];
}

const ShoppingItemCreateModal: React.FC<ShoppingItemCreateModalProps> = ({
  open,
  onClose,
  onSubmit,
  itemForm,
  setItemForm,
  activeListId,
  lists,
  unitOptions,
}) => {
  if (!open) return null;

  const hasLockedList = Boolean(activeListId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Nuovo articolo</h3>
          <p className="text-sm text-gray-500">
            Inserisci rapidamente un articolo nella lista spesa.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm text-gray-600">
              Lista
              <select
                className={shoppingInputClass}
                value={itemForm.shopping_list_id}
                onChange={(e) =>
                  setItemForm((prev) => ({
                    ...prev,
                    shopping_list_id: e.target.value,
                  }))
                }
                disabled={hasLockedList}
                required
              >
                <option value="">Seleziona lista</option>
                {lists.map((list) => (
                  <option key={list.id} value={String(list.id)}>
                    {list.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm text-gray-600">
              Nome articolo
              <input
                type="text"
                className={shoppingInputClass}
                value={itemForm.name_original}
                onChange={(e) =>
                  setItemForm((prev) => ({
                    ...prev,
                    name_original: e.target.value,
                  }))
                }
                placeholder="Es. Pasta, latte, zucchero"
                required
                autoFocus
              />
            </label>

            <label className="flex flex-col gap-1 text-sm text-gray-600">
              Quantità
              <input
                type="number"
                min="0"
                step="0.01"
                className={shoppingInputClass}
                value={itemForm.quantity}
                onChange={(e) =>
                  setItemForm((prev) => ({
                    ...prev,
                    quantity: e.target.value,
                  }))
                }
                placeholder="Es. 2"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm text-gray-600">
              Unità
              <select
                className={shoppingInputClass}
                value={itemForm.unit_id}
                onChange={(e) =>
                  setItemForm((prev) => ({
                    ...prev,
                    unit_id: e.target.value,
                  }))
                }
              >
                <option value="">Unità predefinita</option>
                {renderCatalogOptions(unitOptions)}
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-1 text-sm text-gray-600">
            Note
            <textarea
              className={`${shoppingInputClass} min-h-[96px] resize-y`}
              value={itemForm.notes}
              onChange={(e) =>
                setItemForm((prev) => ({
                  ...prev,
                  notes: e.target.value,
                }))
              }
              placeholder="Note opzionali"
            />
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={shoppingButtonSecondaryClass}
            >
              Annulla
            </button>
            <button
              type="submit"
              className={shoppingButtonPrimaryClass}
              disabled={!itemForm.shopping_list_id || !itemForm.name_original.trim()}
            >
              Crea articolo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShoppingItemCreateModal;