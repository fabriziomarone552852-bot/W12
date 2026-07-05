// src/components/shared/shopping/ShoppingPurchaseModal.tsx
import React from 'react';
import type {
  CatalogOption,
  PurchaseFormState,
  ShoppingListItem,
  ShoppingSupplier,
} from '../../../types/shopping';
import {
  shoppingButtonPrimaryClass,
  shoppingButtonSecondaryClass,
  shoppingCardClass,
  shoppingInputClass,
} from './shoppingUi';
import { renderCatalogOptions } from './shoppingItems.utils';

interface ShoppingPurchaseModalProps {
  isOpen: boolean;
  item: ShoppingListItem | null;
  form: PurchaseFormState;
  suppliers: ShoppingSupplier[];
  currencyOptions: CatalogOption[];
  offerFlagOptions: CatalogOption[];
  onChange: React.Dispatch<React.SetStateAction<PurchaseFormState>>;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

const ShoppingPurchaseModal: React.FC<ShoppingPurchaseModalProps> = ({
  isOpen,
  item,
  form,
  suppliers,
  currencyOptions,
  offerFlagOptions,
  onChange,
  onClose,
  onSubmit,
}) => {
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm">
      <div className={`${shoppingCardClass} w-full max-w-2xl p-5`}>
        <h2 className="mb-2 text-lg font-bold text-gray-900">Registra acquisto</h2>
        <p className="mb-4 text-sm text-gray-500">
          Stai completando{' '}
          <span className="font-semibold text-gray-700">
            {item.name_original}
          </span>
        </p>

        <form onSubmit={onSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <select
              className={shoppingInputClass}
              value={form.supplier_id}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  supplier_id: e.target.value,
                }))
              }
            >
              <option value="">Nessun fornitore</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={String(supplier.id)}>
                  {supplier.name}
                </option>
              ))}
            </select>

            <input
              type="number"
              step="0.01"
              min="0"
              className={shoppingInputClass}
              placeholder="Prezzo"
              value={form.price}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  price: e.target.value,
                }))
              }
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              className={shoppingInputClass}
              value={form.purchase_date}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  purchase_date: e.target.value,
                }))
              }
              required
            />

            <select
              className={shoppingInputClass}
              value={form.currency_id}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  currency_id: e.target.value,
                }))
              }
            >
              <option value="">Valuta</option>
              {renderCatalogOptions(currencyOptions)}
            </select>
          </div>

          <select
            className={shoppingInputClass}
            value={form.offer_flag_id}
            onChange={(e) =>
              onChange((prev) => ({
                ...prev,
                offer_flag_id: e.target.value,
              }))
            }
          >
            <option value="">Nessun flag offerta</option>
            {renderCatalogOptions(offerFlagOptions)}
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
              Conferma acquisto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShoppingPurchaseModal;