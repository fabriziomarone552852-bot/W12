// src/components/shared/shopping/ShoppingBulkPurchasePanel.tsx
import React, { useMemo, useState } from 'react';
import { useShoppingMutations } from '../../../hooks/useShoppingMutations';
import type {
  CatalogOption,
  PurchaseFormState,
  ShoppingListItem,
  ShoppingSupplier,
} from '../../../types/shopping';
import {
  shoppingButtonPrimaryClass,
  shoppingCardClass,
  shoppingInputClass,
} from './shoppingUi';
import { emptyPurchaseForm, getEurCurrencyId, renderCatalogOptions } from './shoppingItems.utils';

interface BulkPurchaseRowState {
  item: ShoppingListItem;
  form: PurchaseFormState;
  saving: boolean;
}

interface ShoppingBulkPurchasePanelProps {
  items: ShoppingListItem[];
  suppliers: ShoppingSupplier[];
  currencyOptions: CatalogOption[];
  offerFlagOptions: CatalogOption[];
}

const ShoppingBulkPurchasePanel: React.FC<ShoppingBulkPurchasePanelProps> = ({
  items,
  suppliers,
  currencyOptions,
  offerFlagOptions,
}) => {
  const mutations = useShoppingMutations();

  const eurCurrencyId = useMemo(
    () => getEurCurrencyId(currencyOptions),
    [currencyOptions],
  );

  const openItems = useMemo(
    () => items.filter((item) => !item.is_purchased),
    [items],
  );

  const [rows, setRows] = useState<BulkPurchaseRowState[]>(
    openItems.map((item) => ({
      item,
      form: emptyPurchaseForm(eurCurrencyId),
      saving: false,
    })),
  );

  const updateRowForm = (itemId: number, updater: (prev: PurchaseFormState) => PurchaseFormState) => {
    setRows((prev) =>
      prev.map((row) =>
        row.item.id === itemId
          ? { ...row, form: updater(row.form) }
          : row,
      ),
    );
  };

  const handleSaveRow = async (itemId: number) => {
    const row = rows.find((r) => r.item.id === itemId);
    if (!row) return;

    const { form } = row;
    if (!form.price || !form.purchase_date || !form.currency_id) {
      // puoi eventualmente aggiungere un feedback di validazione locale
      return;
    }

    setRows((prev) =>
      prev.map((r) =>
        r.item.id === itemId ? { ...r, saving: true } : r,
      ),
    );

    try {
      await mutations.addPrice({
        itemId,
        form: {
          supplier_id: form.supplier_id,
          price: form.price,
          purchase_date: form.purchase_date,
          currency_id: form.currency_id,
          offer_flag_id: form.offer_flag_id,
        },
      });
      // dopo il salvataggio puoi opzionalmente rimuovere la riga o resettare il form
      setRows((prev) =>
        prev.map((r) =>
          r.item.id === itemId
            ? { ...r, form: emptyPurchaseForm(eurCurrencyId), saving: false }
            : r,
        ),
      );
    } finally {
      setRows((prev) =>
        prev.map((r) =>
          r.item.id === itemId ? { ...r, saving: false } : r,
        ),
      );
    }
  };

  if (openItems.length === 0) {
    return (
      <div className={`${shoppingCardClass} p-4 text-xs text-gray-500`}>
        Nessun articolo aperto da acquistare.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700">
          Acquisto multiplo
        </h2>
        <p className="text-xs text-gray-400">
          {openItems.length} articoli aperti
        </p>
      </div>

      <div className="space-y-2">
        {rows.map(({ item, form, saving }) => (
          <div
            key={item.id}
            className={`${shoppingCardClass} flex flex-col gap-2 p-3`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-gray-800">
                  {item.name_original}
                </p>
                {item.notes && (
                  <p className="truncate text-xs text-gray-400">{item.notes}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <select
                className={shoppingInputClass}
                value={form.supplier_id}
                onChange={(e) =>
                  updateRowForm(item.id, (prev) => ({
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
                  updateRowForm(item.id, (prev) => ({
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
                  updateRowForm(item.id, (prev) => ({
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
                  updateRowForm(item.id, (prev) => ({
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
                updateRowForm(item.id, (prev) => ({
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
                onClick={() => handleSaveRow(item.id)}
                disabled={saving}
                className={`${shoppingButtonPrimaryClass} text-xs disabled:opacity-50`}
              >
                {saving ? 'Salvataggio...' : 'Registra acquisto'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShoppingBulkPurchasePanel;