// src/components/shared/shopping/ShoppingItemsColumn.tsx
import React, { useMemo, useState } from 'react';
import { useShoppingMutations } from '../../../hooks/useShoppingMutations';
import { useModal } from '../../../hooks/useModals';
import { useAutoFitPagination } from '../../../hooks/useAutoFitPagination';
import { useDebounce } from '../../../hooks/useDebounce';
import type {
  CatalogOption,
  ItemFormState,
  PurchaseFormState,
  ShoppingList,
  ShoppingListItem,
  ShoppingSupplier,
} from '../../../types/shopping';
import {
  shoppingButtonPrimaryClass,
  shoppingButtonSecondaryClass,
  shoppingCardClass,
  shoppingInputClass,
} from './shoppingUi';

interface ShoppingItemsColumnProps {
  items: ShoppingListItem[];
  lists: ShoppingList[];
  suppliers: ShoppingSupplier[];
  unitOptions: CatalogOption[];
  itemStatusOptions: CatalogOption[];
  currencyOptions: CatalogOption[];
  offerFlagOptions: CatalogOption[];
  loading: boolean;
  activeListId: string;
}

const emptyItemForm = (shoppingListId = ''): ItemFormState => ({
  shopping_list_id: shoppingListId,
  name_original: '',
  quantity: '',
  unit_id: '',
  notes: '',
  status_id: '',
});

const emptyPurchaseForm = (): PurchaseFormState => ({
  supplier_id: '',
  price: '',
  purchase_date: new Date().toISOString().slice(0, 10),
  currency_id: '',
  offer_flag_id: '',
});

const renderCatalogOptions = (options: CatalogOption[]) =>
  options.map((option) => (
    <option key={option.id} value={String(option.id)}>
      {option.code_name}
    </option>
  ));

const ShoppingItemsColumn: React.FC<ShoppingItemsColumnProps> = ({
  items,
  lists,
  suppliers,
  unitOptions,
  itemStatusOptions,
  currencyOptions,
  offerFlagOptions,
  loading,
  activeListId,
}) => {
  const mutations = useShoppingMutations();
  const containerRef = React.useRef<HTMLDivElement>(null);

  const createModal = useModal<string>();
  const editModal = useModal<ShoppingListItem>();
  const purchaseModal = useModal<ShoppingListItem>();

  const [filtroStato, setFiltroStato] = useState<'tutti' | 'aperti' | 'completati'>('tutti');
  const [filtroNome, setFiltroNome] = useState('');
  const debouncedNome = useDebounce(filtroNome);

  const [itemForm, setItemForm] = useState<ItemFormState>(emptyItemForm());
  const [editForm, setEditForm] = useState<ItemFormState>(emptyItemForm());
  const [purchaseForm, setPurchaseForm] = useState<PurchaseFormState>(emptyPurchaseForm());

  const filteredItems = useMemo(() => {
    let result = items;

    if (filtroStato === 'aperti') result = result.filter((item) => !item.is_purchased);
    if (filtroStato === 'completati') result = result.filter((item) => item.is_purchased);

    const nome = debouncedNome.trim().toLowerCase();
    if (nome) {
      result = result.filter((item) =>
        item.name_original.toLowerCase().includes(nome),
      );
    }

    return result;
  }, [items, filtroStato, debouncedNome]);

  const { visibleItems, currentPage, totalPages, setCurrentPage } =
    useAutoFitPagination(filteredItems, containerRef, 40, 8);

  const currentListName =
    lists.find((list) => String(list.id) === activeListId)?.name ?? 'Tutte le liste';

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.name_original.trim()) return;

    await mutations.createItem({
      shopping_list_id: itemForm.shopping_list_id,
      name_original: itemForm.name_original.trim(),
      quantity: itemForm.quantity,
      unit_id: itemForm.unit_id,
      notes: itemForm.notes.trim(),
      status_id: itemForm.status_id,
    });

    setItemForm(emptyItemForm(itemForm.shopping_list_id));
    createModal.close();
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal.data) return;

    await mutations.updateItem({
      id: editModal.data.id,
      data: {
        name_original: editForm.name_original.trim(),
        quantity: editForm.quantity,
        unit_id: editForm.unit_id,
        notes: editForm.notes.trim(),
        status_id: editForm.status_id,
      },
    });

    editModal.close();
  };

  const handleToggle = async (item: ShoppingListItem) => {
    if (!item.is_purchased) {
      setPurchaseForm(emptyPurchaseForm());
      purchaseModal.open(item);
      return;
    }

    await mutations.updateItem({
      id: item.id,
      data: { is_purchased: false },
    });
  };

  const handleDelete = async (item: ShoppingListItem) => {
    if (!window.confirm(`Eliminare "${item.name_original}"?`)) return;
    await mutations.deleteItem(item.id);
  };

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseModal.data) return;

    await mutations.addPrice({
      itemId: purchaseModal.data.id,
      form: {
        supplier_id: purchaseForm.supplier_id,
        price: purchaseForm.price,
        purchase_date: purchaseForm.purchase_date,
        currency_id: purchaseForm.currency_id,
        offer_flag_id: purchaseForm.offer_flag_id,
      },
    });

    purchaseModal.close();
    setPurchaseForm(emptyPurchaseForm());
  };

  const startEdit = (item: ShoppingListItem) => {
    setEditForm({
      shopping_list_id: String(item.shopping_list_id),
      name_original: item.name_original,
      quantity: item.quantity == null ? '' : String(item.quantity),
      unit_id: item.unit_id == null ? '' : String(item.unit_id),
      notes: item.notes ?? '',
      status_id: item.status_id == null ? '' : String(item.status_id),
    });
    editModal.open(item);
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="shrink-0 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700">
          {currentListName}
        </h2>
        <button
          type="button"
          onClick={() => {
            setItemForm(emptyItemForm(activeListId));
            createModal.open(activeListId);
          }}
          className={`${shoppingButtonPrimaryClass} text-xs`}
          disabled={!activeListId}
        >
          + Articolo
        </button>
      </div>

      <div className="shrink-0 flex gap-2">
        <input
          className={`${shoppingInputClass} flex-1`}
          placeholder="Cerca..."
          value={filtroNome}
          onChange={(e) => setFiltroNome(e.target.value)}
        />
        <select
          className={`${shoppingInputClass} w-32`}
          value={filtroStato}
          onChange={(e) =>
            setFiltroStato(e.target.value as 'tutti' | 'aperti' | 'completati')
          }
        >
          <option value="tutti">Tutti</option>
          <option value="aperti">Aperti</option>
          <option value="completati">Completati</option>
        </select>
      </div>

      <div ref={containerRef} className="min-h-0 flex-1 space-y-1.5 overflow-y-auto">
        {loading ? (
          <p className="py-4 text-center text-xs text-gray-400">Caricamento...</p>
        ) : visibleItems.length === 0 ? (
          <p className="py-4 text-center text-xs text-gray-400">Nessun articolo.</p>
        ) : (
          visibleItems.map((item) => (
            <div
              key={item.id}
              className={`${shoppingCardClass} flex items-center gap-2 p-2.5`}
            >
              <button
                type="button"
                onClick={() => handleToggle(item)}
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
                  onClick={() => startEdit(item)}
                  className="text-xs text-gray-400 hover:text-blue-500"
                  aria-label={`Modifica ${item.name_original}`}
                >
                  ✎
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(item)}
                  className="text-xs text-gray-400 hover:text-red-500"
                  aria-label={`Elimina ${item.name_original}`}
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="shrink-0 flex items-center justify-center gap-2 text-xs text-gray-500">
          <button
            type="button"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="rounded-lg border border-gray-200 px-2 py-1 disabled:opacity-30"
          >
            ‹
          </button>
          <span>
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="rounded-lg border border-gray-200 px-2 py-1 disabled:opacity-30"
          >
            ›
          </button>
        </div>
      )}

      {createModal.isOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm">
          <div className={`${shoppingCardClass} w-full max-w-md p-5`}>
            <h2 className="mb-4 text-lg font-bold text-gray-900">Nuovo articolo</h2>

            <form onSubmit={handleCreate} className="space-y-3">
              <input
                className={shoppingInputClass}
                placeholder="Nome articolo"
                value={itemForm.name_original}
                onChange={(e) =>
                  setItemForm((prev) => ({
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
                  value={itemForm.quantity}
                  onChange={(e) =>
                    setItemForm((prev) => ({
                      ...prev,
                      quantity: e.target.value,
                    }))
                  }
                />

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
                  <option value="">Nessuna unità</option>
                  {renderCatalogOptions(unitOptions)}
                </select>
              </div>

              <input
                className={shoppingInputClass}
                placeholder="Note"
                value={itemForm.notes}
                onChange={(e) =>
                  setItemForm((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
              />

              <select
                className={shoppingInputClass}
                value={itemForm.status_id}
                onChange={(e) =>
                  setItemForm((prev) => ({
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
                  onClick={createModal.close}
                  className={shoppingButtonSecondaryClass}
                >
                  Annulla
                </button>
                <button type="submit" className={shoppingButtonPrimaryClass}>
                  Aggiungi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editModal.isOpen && editModal.data && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm">
          <div className={`${shoppingCardClass} w-full max-w-md p-5`}>
            <h2 className="mb-4 text-lg font-bold text-gray-900">Modifica articolo</h2>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <input
                className={shoppingInputClass}
                placeholder="Nome"
                value={editForm.name_original}
                onChange={(e) =>
                  setEditForm((prev) => ({
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
                  value={editForm.quantity}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      quantity: e.target.value,
                    }))
                  }
                />

                <select
                  className={shoppingInputClass}
                  value={editForm.unit_id}
                  onChange={(e) =>
                    setEditForm((prev) => ({
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
                value={editForm.notes}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
              />

              <select
                className={shoppingInputClass}
                value={editForm.status_id}
                onChange={(e) =>
                  setEditForm((prev) => ({
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
                  onClick={editModal.close}
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
      )}

      {purchaseModal.isOpen && purchaseModal.data && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm">
          <div className={`${shoppingCardClass} w-full max-w-2xl p-5`}>
            <h2 className="mb-2 text-lg font-bold text-gray-900">Registra acquisto</h2>
            <p className="mb-4 text-sm text-gray-500">
              Stai completando{' '}
              <span className="font-semibold text-gray-700">
                {purchaseModal.data.name_original}
              </span>
            </p>

            <form onSubmit={handlePurchase} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <select
                  className={shoppingInputClass}
                  value={purchaseForm.supplier_id}
                  onChange={(e) =>
                    setPurchaseForm((prev) => ({
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
                  value={purchaseForm.price}
                  onChange={(e) =>
                    setPurchaseForm((prev) => ({
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
                  value={purchaseForm.purchase_date}
                  onChange={(e) =>
                    setPurchaseForm((prev) => ({
                      ...prev,
                      purchase_date: e.target.value,
                    }))
                  }
                  required
                />

                <select
                  className={shoppingInputClass}
                  value={purchaseForm.currency_id}
                  onChange={(e) =>
                    setPurchaseForm((prev) => ({
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
                value={purchaseForm.offer_flag_id}
                onChange={(e) =>
                  setPurchaseForm((prev) => ({
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
                  onClick={purchaseModal.close}
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
      )}
    </div>
  );
};

export default ShoppingItemsColumn;