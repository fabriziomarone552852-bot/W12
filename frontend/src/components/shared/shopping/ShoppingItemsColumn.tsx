// src/components/shared/shopping/ShoppingItemsColumn.tsx
import React, { useState, useMemo } from 'react';
import { useShoppingMutations } from '../../../hooks/useShoppingMutations';
import { useModal } from '../../../hooks/useModals';
import { useAutoFitPagination } from '../../../hooks/useAutoFitPagination';
import { useDebounce } from '../../../hooks/useDebounce';
import type { ShoppingList, ShoppingListItem, ItemFormState, PurchaseFormState } from '../../../types/shopping';
import { shoppingButtonPrimaryClass, shoppingButtonSecondaryClass, shoppingCardClass, shoppingInputClass } from './shoppingUi';

interface ShoppingItemsColumnProps {
  items: ShoppingListItem[];
  lists: ShoppingList[];
  loading: boolean;
  activeListId: string;
}

const ShoppingItemsColumn: React.FC<ShoppingItemsColumnProps> = ({ items, lists, loading, activeListId }) => {
  const mutations = useShoppingMutations();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const createModal = useModal<string>(); // shopping_list_id
  const editModal = useModal<ShoppingListItem>();
  const purchaseModal = useModal<ShoppingListItem>();

  const [filtroStato, setFiltroStato] = useState<'tutti' | 'aperti' | 'completati'>('tutti');
  const [filtroNome, setFiltroNome] = useState('');
  const debouncedNome = useDebounce(filtroNome);
  const [itemForm, setItemForm] = useState<ItemFormState>({ shopping_list_id: '', name_original: '', quantity: '', unit_id: '', notes: '', status_id: '' });
  const [editForm, setEditForm] = useState<ItemFormState>({ shopping_list_id: '', name_original: '', quantity: '', unit_id: '', notes: '', status_id: '' });
  const [purchaseForm, setPurchaseForm] = useState<PurchaseFormState>({ supplier_id: '', price: '', purchase_date: new Date().toISOString().slice(0, 10), currency_id: '', offer_flag_id: '', product_name_original: '', product_name_normalized: '' });

  const filteredItems = useMemo(() => {
    let result = items;
    if (filtroStato === 'aperti') result = result.filter((i) => !i.is_purchased);
    if (filtroStato === 'completati') result = result.filter((i) => i.is_purchased);
    const n = debouncedNome.trim().toLowerCase();
    if (n) result = result.filter((i) => i.name_original.toLowerCase().includes(n));
    return result;
  }, [items, filtroStato, debouncedNome]);

  const { visibleItems, currentPage, totalPages, setCurrentPage } = useAutoFitPagination(filteredItems, containerRef, 40, 8);

  const currentListName = lists.find((l) => String(l.id) === activeListId)?.name ?? 'Tutte le liste';

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.name_original.trim()) return;
    await mutations.createItem(itemForm);
    setItemForm({ shopping_list_id: itemForm.shopping_list_id, name_original: '', quantity: '', unit_id: '', notes: '', status_id: '' });
    createModal.close();
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal.data) return;
    await mutations.updateItem({ id: editModal.data.id, data: editForm });
    editModal.close();
  };

  const handleToggle = async (item: ShoppingListItem) => {
    if (!item.is_purchased) {
      purchaseModal.open(item);
      return;
    }
    await mutations.updateItem({ id: item.id, data: { is_purchased: false } });
  };

  const handleDelete = async (item: ShoppingListItem) => {
    if (!window.confirm(`Eliminare "${item.name_original}"?`)) return;
    await mutations.deleteItem(item.id);
  };

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseModal.data) return;
    await mutations.addPrice({ itemId: purchaseModal.data.id, form: purchaseForm });
    purchaseModal.close();
    setPurchaseForm({ supplier_id: '', price: '', purchase_date: new Date().toISOString().slice(0, 10), currency_id: '', offer_flag_id: '', product_name_original: '', product_name_normalized: '' });
  };

  const startEdit = (item: ShoppingListItem) => {
    setEditForm({
      shopping_list_id: String(item.shopping_list_id),
      name_original: item.name_original,
      quantity: item.quantity == null ? '' : String(item.quantity),
      unit_id: item.unit_id == null ? '' : String(item.unit_id),
      notes: item.notes ?? '',
      status_id: String(item.status_id),
    });
    editModal.open(item);
  };

  return (
    <div className="flex flex-col h-full min-h-0 gap-3">
      <div className="flex items-center justify-between shrink-0">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">{currentListName}</h2>
        <button type="button" onClick={() => { setItemForm({ shopping_list_id: activeListId, name_original: '', quantity: '', unit_id: '', notes: '', status_id: '' }); createModal.open(activeListId); }} className={shoppingButtonPrimaryClass + ' text-xs'} disabled={!activeListId}>
          + Articolo
        </button>
      </div>

      <div className="flex gap-2 shrink-0">
        <input className={shoppingInputClass + ' flex-1'} placeholder="Cerca..." value={filtroNome} onChange={(e) => setFiltroNome(e.target.value)} />
        <select className={shoppingInputClass + ' w-32'} value={filtroStato} onChange={(e) => setFiltroStato(e.target.value as any)}>
          <option value="tutti">Tutti</option>
          <option value="aperti">Aperti</option>
          <option value="completati">Completati</option>
        </select>
      </div>

      <div ref={containerRef} className="flex-1 overflow-y-auto space-y-1.5 min-h-0">
        {loading ? (
          <p className="text-xs text-gray-400 text-center py-4">Caricamento...</p>
        ) : visibleItems.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">Nessun articolo.</p>
        ) : (
          visibleItems.map((item) => (
            <div key={item.id} className={`${shoppingCardClass} p-2.5 flex items-center gap-2`}>
              <button type="button" onClick={() => handleToggle(item)} className={`shrink-0 w-5 h-5 rounded-full border-2 transition ${item.is_purchased ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-green-400'}`}>
                {item.is_purchased && <span className="text-white text-xs flex items-center justify-center">✓</span>}
              </button>
              <div className="min-w-0 flex-1">
                <p className={`text-sm truncate ${item.is_purchased ? 'line-through text-gray-400' : 'text-gray-800'}`}>{item.name_original}</p>
                {item.notes && <p className="text-xs text-gray-400 truncate">{item.notes}</p>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button type="button" onClick={() => startEdit(item)} className="text-gray-400 hover:text-blue-500 text-xs">✎</button>
                <button type="button" onClick={() => handleDelete(item)} className="text-gray-400 hover:text-red-500 text-xs">✕</button>
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 shrink-0 text-xs text-gray-500">
          <button type="button" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="px-2 py-1 rounded-lg border border-gray-200 disabled:opacity-30">‹</button>
          <span>{currentPage} / {totalPages}</span>
          <button type="button" onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="px-2 py-1 rounded-lg border border-gray-200 disabled:opacity-30">›</button>
        </div>
      )}

      {createModal.isOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4">
          <div className={`${shoppingCardClass} w-full max-w-md p-5`}>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Nuovo articolo</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <input className={shoppingInputClass} placeholder="Nome articolo" value={itemForm.name_original} onChange={(e) => setItemForm((p) => ({ ...p, name_original: e.target.value }))} required />
              <div className="grid grid-cols-2 gap-3">
                <input className={shoppingInputClass} placeholder="Quantità" value={itemForm.quantity} onChange={(e) => setItemForm((p) => ({ ...p, quantity: e.target.value }))} />
                <input className={shoppingInputClass} placeholder="Unit ID" value={itemForm.unit_id} onChange={(e) => setItemForm((p) => ({ ...p, unit_id: e.target.value }))} />
              </div>
              <input className={shoppingInputClass} placeholder="Note" value={itemForm.notes} onChange={(e) => setItemForm((p) => ({ ...p, notes: e.target.value }))} />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={createModal.close} className={shoppingButtonSecondaryClass}>Annulla</button>
                <button type="submit" className={shoppingButtonPrimaryClass}>Aggiungi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editModal.isOpen && editModal.data && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4">
          <div className={`${shoppingCardClass} w-full max-w-md p-5`}>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Modifica articolo</h2>
            <form onSubmit={handleSaveEdit} className="space-y-3">
              <input className={shoppingInputClass} placeholder="Nome" value={editForm.name_original} onChange={(e) => setEditForm((p) => ({ ...p, name_original: e.target.value }))} required />
              <div className="grid grid-cols-2 gap-3">
                <input className={shoppingInputClass} placeholder="Quantità" value={editForm.quantity} onChange={(e) => setEditForm((p) => ({ ...p, quantity: e.target.value }))} />
                <input className={shoppingInputClass} placeholder="Unit ID" value={editForm.unit_id} onChange={(e) => setEditForm((p) => ({ ...p, unit_id: e.target.value }))} />
              </div>
              <input className={shoppingInputClass} placeholder="Note" value={editForm.notes} onChange={(e) => setEditForm((p) => ({ ...p, notes: e.target.value }))} />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={editModal.close} className={shoppingButtonSecondaryClass}>Annulla</button>
                <button type="submit" className={shoppingButtonPrimaryClass}>Salva</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {purchaseModal.isOpen && purchaseModal.data && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4">
          <div className={`${shoppingCardClass} w-full max-w-2xl p-5`}>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Registra acquisto</h2>
            <p className="text-sm text-gray-500 mb-4">Stai completando <span className="font-semibold text-gray-700">{purchaseModal.data.name_original}</span></p>
            <form onSubmit={handlePurchase} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input className={shoppingInputClass} placeholder="Supplier ID" value={purchaseForm.supplier_id} onChange={(e) => setPurchaseForm((p) => ({ ...p, supplier_id: e.target.value }))} />
                <input type="number" step="0.01" min="0" className={shoppingInputClass} placeholder="Prezzo" value={purchaseForm.price} onChange={(e) => setPurchaseForm((p) => ({ ...p, price: e.target.value }))} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="date" className={shoppingInputClass} value={purchaseForm.purchase_date} onChange={(e) => setPurchaseForm((p) => ({ ...p, purchase_date: e.target.value }))} required />
                <input className={shoppingInputClass} placeholder="Currency ID" value={purchaseForm.currency_id} onChange={(e) => setPurchaseForm((p) => ({ ...p, currency_id: e.target.value }))} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={purchaseModal.close} className={shoppingButtonSecondaryClass}>Annulla</button>
                <button type="submit" className={shoppingButtonPrimaryClass}>Conferma acquisto</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShoppingItemsColumn;
