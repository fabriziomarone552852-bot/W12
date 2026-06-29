import React from 'react';
import ShoppingListsColumn from '../components/shared/shopping/ShoppingListsColumn';
import ShoppingItemsColumn from '../components/shared/shopping/ShoppingItemsColumn';
import ShoppingControlsColumn from '../components/shared/shopping/ShoppingControlsColumn';
import { useShoppingPage } from '../hooks/useShoppingPage';

const ShoppingPage: React.FC = () => {
  const {
    lists,
    suppliers,
    loading,
    loadingLists,
    listForm,
    setListForm,
    itemForm,
    setItemForm,
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
      <div className="mx-auto max-w-[1800px]">
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
            setListForm={setListForm}
            setItemForm={setItemForm}
            creaLista={creaLista}
            creaItem={creaItem}
          />
        </div>
      </div>
    </div>
  );
};

export default ShoppingPage;
