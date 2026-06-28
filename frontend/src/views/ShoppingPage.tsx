import React from 'react';
import ShoppingListsColumn from '../components/shared/shopping/ShoppingListsColumn';
import ShoppingItemsColumn from '../components/shared/shopping/ShoppingItemsColumn';
import ShoppingControlsColumn from '../components/shared/shopping/ShoppingControlsColumn';
import { useShoppingPage } from '../hooks/useShoppingPage';
import { shoppingButtonPrimaryClass, shoppingCardClass, shoppingInputClass } from '../components/shared/shopping/shoppingUi';

const ShoppingPage: React.FC = () => {
  const {
    lists,
    suppliers,
    loading,
    loadingLists,
    error,
    success,
    setSuccess,
    purchaseItem,
    setPurchaseItem,
    purchaseForm,
    setPurchaseForm,
    listForm,
    setListForm,
    itemForm,
    setItemForm,
    supplierForm,
    setSupplierForm,    
    editingListId,
    setEditingListId,
    editingItemId,
    setEditingItemId,
    editListForm,
    setEditListForm,
    editItemForm,
    setEditItemForm,
    filtroListaId,
    setFiltroListaId,
    filtroStato,
    setFiltroStato,
    filtroNome,
    setFiltroNome,
    filtroNote,
    setFiltroNote,
    resetFiltri,
    creaLista,
    creaItem,
    creaFornitore,
    confermaAcquisto,
    toggleFatto,
    deleteItem,
    deleteList,
    startEditList,
    saveEditList,
    startEditItem,
    saveEditItem,
    currentListName,
    pagination,
  } = useShoppingPage();

  const {
    currentPage: safeCurrentPage,
    setCurrentPage,
    rowsPerPage,
    setRowsPerPage,
    totalItems,
    totalPages,
    startIndex,
    endIndex,
    paginatedData,
  } = pagination;

  return (
    <div className="min-h-full bg-[#f5f7fb] p-4 md:p-6">
      <div className="mx-auto max-w-[1800px] space-y-4">
        {error && (
          <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600">!</div>
              <div>
                <h2 className="text-sm font-semibold text-red-800">Errore operazione shopping</h2>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="fixed right-4 top-4 z-50 w-full max-w-sm rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">✓</div>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-semibold text-emerald-800">Operazione completata</h2>
                <p className="mt-1 text-sm text-emerald-700">{success}</p>
              </div>
              <button type="button" onClick={() => setSuccess(null)} className="rounded-full p-1 text-emerald-600 transition hover:bg-emerald-100" aria-label="Chiudi messaggio di successo">
                ×
              </button>
            </div>
          </div>
        )}

        {purchaseItem && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm">
            <div className={`${shoppingCardClass} z-50 w-full max-w-2xl p-5 lg:p-6`}>
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Registra acquisto</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Stai completando <span className="font-semibold text-gray-700">{purchaseItem.name_original}</span>. Inserisci fornitore, prezzo e dettagli dell'acquisto.
                  </p>
                </div>
                <button type="button" onClick={() => setPurchaseItem(null)} className="rounded-full px-2 py-1 text-sm text-gray-500 transition hover:bg-gray-100 hover:text-gray-700">
                  Chiudi
                </button>
              </div>

              <form onSubmit={confermaAcquisto} className="grid gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Fornitore</label>
                    <select className={shoppingInputClass} value={purchaseForm.supplier_id} onChange={(e) => setPurchaseForm((p) => ({ ...p, supplier_id: e.target.value }))} required>
                      <option value="">Seleziona fornitore</option>
                      {suppliers.map((supplier) => <option key={supplier.id} value={String(supplier.id)}>{supplier.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Prezzo</label>
                    <input type="number" step="0.01" min="0" className={shoppingInputClass} value={purchaseForm.price} onChange={(e) => setPurchaseForm((p) => ({ ...p, price: e.target.value }))} required />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Data acquisto</label>
                    <input type="date" className={shoppingInputClass} value={purchaseForm.purchase_date} onChange={(e) => setPurchaseForm((p) => ({ ...p, purchase_date: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Currency ID</label>
                    <input type="number" className={shoppingInputClass} value={purchaseForm.currency_id} onChange={(e) => setPurchaseForm((p) => ({ ...p, currency_id: e.target.value }))} />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Offer Flag ID</label>
                    <input type="number" className={shoppingInputClass} value={purchaseForm.offer_flag_id} onChange={(e) => setPurchaseForm((p) => ({ ...p, offer_flag_id: e.target.value }))} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Nome prodotto originale</label>
                    <input className={shoppingInputClass} value={purchaseForm.product_name_original ?? ''} onChange={(e) => setPurchaseForm((p) => ({ ...p, product_name_original: e.target.value }))} />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Nome prodotto normalizzato</label>
                  <input className={shoppingInputClass} value={purchaseForm.product_name_normalized ?? ''} onChange={(e) => setPurchaseForm((p) => ({ ...p, product_name_normalized: e.target.value }))} />
                </div>

                <div className="flex flex-wrap justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setPurchaseItem(null)} className="inline-flex items-center rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50">
                    Annulla
                  </button>
                  <button type="submit" className={shoppingButtonPrimaryClass}>Conferma acquisto</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[330px_minmax(0,1.35fr)_360px]">
          <ShoppingListsColumn
            lists={lists}
            loadingLists={loadingLists}
            activeListId={filtroListaId}
            editingListId={editingListId}
            editListForm={editListForm}
            setActiveListId={setFiltroListaId}
            setEditListForm={setEditListForm}
            startEditList={startEditList}
            saveEditList={saveEditList}
            cancelEdit={() => setEditingListId(null)}
            deleteList={deleteList}
          />

          <ShoppingItemsColumn
            loading={loading}
            lists={lists}
            currentListName={currentListName}
            filtroListaId={filtroListaId}
            filtroStato={filtroStato}
            filtroNome={filtroNome}
            filtroNote={filtroNote}
            setFiltroListaId={setFiltroListaId}
            setFiltroStato={setFiltroStato}
            setFiltroNome={setFiltroNome}
            setFiltroNote={setFiltroNote}
            resetFiltri={resetFiltri}
            totalItems={totalItems}
            startIndex={startIndex}
            endIndex={endIndex}
            rowsPerPage={rowsPerPage}
            setRowsPerPage={setRowsPerPage}
            safeCurrentPage={safeCurrentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
            paginatedData={paginatedData}
            editingItemId={editingItemId}
            editItemForm={editItemForm}
            setEditItemForm={setEditItemForm}
            startEditItem={startEditItem}
            saveEditItem={saveEditItem}
            cancelEditItem={() => setEditingItemId(null)}
            toggleFatto={toggleFatto}
            deleteItem={deleteItem}
          />

          <ShoppingControlsColumn
            lists={lists}
            suppliers={suppliers}
            loading={loading}
            loadingLists={loadingLists}
            listForm={listForm}
            itemForm={itemForm}
            supplierForm={supplierForm}
            setListForm={setListForm}
            setItemForm={setItemForm}
            setSupplierForm={setSupplierForm}
            creaLista={creaLista}
            creaItem={creaItem}
            creaFornitore={creaFornitore}
          />
        </div>
      </div>
    </div>
  );
};

export default ShoppingPage;
