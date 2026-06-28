import React from 'react';
import type { ListFormState, ShoppingList } from './types';
import { shoppingButtonPrimaryClass, shoppingButtonSecondaryClass, shoppingCardClass, shoppingIconButtonClass, shoppingInputClass } from './shoppingUi';

interface ShoppingListsColumnProps {
  lists: ShoppingList[];
  loadingLists: boolean;
  activeListId: string;
  editingListId: number | null;
  editListForm: ListFormState;
  setActiveListId: (id: string) => void;
  setEditListForm: React.Dispatch<React.SetStateAction<ListFormState>>;
  startEditList: (list: ShoppingList) => void;
  saveEditList: (listId: number) => void;
  cancelEdit: () => void;
  deleteList: (list: ShoppingList) => void;
}

const ShoppingListsColumn: React.FC<ShoppingListsColumnProps> = ({
  lists,
  loadingLists,
  activeListId,
  editingListId,
  editListForm,
  setActiveListId,
  setEditListForm,
  startEditList,
  saveEditList,
  cancelEdit,
  deleteList,
}) => {
  return (
    <div className={`${shoppingCardClass} flex h-full min-h-[640px] min-w-0 flex-col p-4 lg:p-5`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Liste spesa</h2>
          <p className="text-sm text-gray-500">Accesso rapido e gestione liste.</p>
        </div>
        <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
          {lists.length}
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {loadingLists ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500">
            Caricamento liste...
          </div>
        ) : lists.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500">
            Nessuna lista disponibile.
          </div>
        ) : (
          lists.map((list) => {
            const isActive = String(list.id) === activeListId;
            const isEditing = editingListId === list.id;

            return (
              <div
                key={list.id}
                className={`rounded-2xl border px-3 py-3 shadow-sm transition ${
                  isActive
                    ? 'border-blue-200 bg-blue-50/70'
                    : 'border-gray-200 bg-gray-50 hover:border-blue-200 hover:bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveListId(String(list.id))}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="truncate text-sm font-semibold text-gray-800">{list.name}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                      {list.description?.trim() || 'Nessuna descrizione'}
                    </p>
                  </button>

                  <div className="flex flex-shrink-0 gap-1.5">
                    <button type="button" onClick={() => startEditList(list)} className={shoppingIconButtonClass}>
                      Modifica
                    </button>
                    <button type="button" onClick={() => deleteList(list)} className={shoppingIconButtonClass}>
                      Elimina
                    </button>
                  </div>
                </div>

                {isEditing && (
                  <div className="mt-3 rounded-2xl border border-blue-100 bg-white p-3">
                    <div className="grid gap-3">
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Nome</label>
                        <input
                          className={shoppingInputClass}
                          value={editListForm.name}
                          onChange={(e) => setEditListForm((p) => ({ ...p, name: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Descrizione</label>
                        <textarea
                          className={`${shoppingInputClass} min-h-[88px] resize-none`}
                          value={editListForm.description}
                          onChange={(e) => setEditListForm((p) => ({ ...p, description: e.target.value }))}
                        />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Visibility ID</label>
                          <input
                            type="number"
                            className={shoppingInputClass}
                            value={editListForm.visibility_id}
                            onChange={(e) => setEditListForm((p) => ({ ...p, visibility_id: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Status ID</label>
                          <input
                            type="number"
                            className={shoppingInputClass}
                            value={editListForm.status_id}
                            onChange={(e) => setEditListForm((p) => ({ ...p, status_id: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Owner ID</label>
                          <input
                            type="number"
                            className={shoppingInputClass}
                            value={editListForm.owner_id}
                            onChange={(e) => setEditListForm((p) => ({ ...p, owner_id: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Group ID</label>
                          <input
                            type="number"
                            className={shoppingInputClass}
                            value={editListForm.group_id}
                            onChange={(e) => setEditListForm((p) => ({ ...p, group_id: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => saveEditList(list.id)} className={shoppingButtonPrimaryClass}>
                          Salva
                        </button>
                        <button type="button" onClick={cancelEdit} className={shoppingButtonSecondaryClass}>
                          Annulla
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ShoppingListsColumn;
