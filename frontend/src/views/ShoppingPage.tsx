// src/views/ShoppingPage.tsx
import React, { useMemo, useState } from 'react';
import { useShoppingData } from '../hooks/useShoppingData';
import ShoppingGroupsColumn from '../components/shared/shopping/ShoppingGroupsColumn';
import ShoppingListsColumn from '../components/shared/shopping/ShoppingListsColumn';
import ShoppingItemsColumn from '../components/shared/shopping/ShoppingItemsColumn';
import ShoppingBulkPurchasePanel from '../components/shared/shopping/ShoppingBulkPurchasePanel';
import ShoppingSuppliersColumn from '../components/shared/shopping/ShoppingSuppliersColumn';
import { shoppingCardClass } from '../components/shared/shopping/shoppingUi';
import type { ShoppingList } from '../types/shopping';

const ShoppingPage: React.FC = () => {
  const [activeListId, setActiveListId] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [itemsViewMode, setItemsViewMode] = useState<'lista' | 'bulk'>('lista');

  const filters = useMemo(
    () => ({
      shopping_list_id: activeListId ? Number(activeListId) : null,
      group_id: selectedGroupId,
    }),
    [activeListId, selectedGroupId],
  );

  const {
    groups,
    lists,
    items,
    suppliers,
    members,
    isLoading,
    groupsLoading,
    membersLoading,
    listVisibilityOptions,
    listStatusOptions,
    itemStatusOptions,
    unitOptions,
    currencyOptions,
    offerFlagOptions,
    supplierStatusOptions,
    groupRoleOptions,
  } = useShoppingData(filters);

  const visibleLists = useMemo<ShoppingList[]>(() => {
    if (selectedGroupId == null) {
      return lists;
    }

    return lists.filter((list) => list.group_id === selectedGroupId);
  }, [lists, selectedGroupId]);

  const handleSelectGroup = (groupId: number | null) => {
    setSelectedGroupId(groupId);
    setActiveListId('');
  };

  return (
    <div className="mx-auto flex min-h-full max-w-[1800px] flex-col gap-4 p-4 md:p-6 xl:h-full xl:overflow-hidden">
      <div className="shrink-0">
        <h1 className="text-xl font-bold text-gray-800">Shopping</h1>
        <p className="text-sm text-gray-500">
          Gestione liste spesa, gruppi condivisi, fornitori e prezzi
        </p>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-4 xl:min-h-0 xl:grid-cols-[280px_280px_minmax(0,1fr)_280px]">
        <div className={`${shoppingCardClass} flex h-full min-h-0 flex-col p-4`}>
          <ShoppingGroupsColumn
            groups={groups}
            members={members}
            loading={groupsLoading}
            membersLoading={membersLoading}
            onSelectGroup={handleSelectGroup}
            selectedGroupId={selectedGroupId}
            groupRoleOptions={groupRoleOptions}
          />
        </div>

        <div className={`${shoppingCardClass} flex h-full min-h-0 flex-col p-4`}>
          <ShoppingListsColumn
            lists={visibleLists}
            loadingLists={isLoading}
            activeListId={activeListId}
            setActiveListId={setActiveListId}
            groups={groups}
            listVisibilityOptions={listVisibilityOptions}
            listStatusOptions={listStatusOptions}
          />
        </div>

        <div className={`${shoppingCardClass} flex h-full min-h-0 flex-col p-4`}>
          <div className="mb-3 shrink-0 flex items-center justify-end">
            <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1 text-xs">
              <button
                type="button"
                onClick={() => setItemsViewMode('lista')}
                className={`rounded-lg px-3 py-1.5 transition ${
                  itemsViewMode === 'lista'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Lista articoli
              </button>
              <button
                type="button"
                onClick={() => setItemsViewMode('bulk')}
                className={`rounded-lg px-3 py-1.5 transition ${
                  itemsViewMode === 'bulk'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Acquisto multiplo
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1">
            {itemsViewMode === 'lista' ? (
              <ShoppingItemsColumn
                items={items}
                lists={visibleLists}
                suppliers={suppliers}
                loading={isLoading}
                activeListId={activeListId}
                unitOptions={unitOptions}
                itemStatusOptions={itemStatusOptions}
                currencyOptions={currencyOptions}
                offerFlagOptions={offerFlagOptions}
              />
            ) : (
              <ShoppingBulkPurchasePanel
                items={items}
                suppliers={suppliers}
                currencyOptions={currencyOptions}
                offerFlagOptions={offerFlagOptions}
              />
            )}
          </div>
        </div>

        <div className={`${shoppingCardClass} flex h-full min-h-0 flex-col p-4`}>
          <ShoppingSuppliersColumn
            suppliers={suppliers}
            supplierStatusOptions={supplierStatusOptions}
          />
        </div>
      </div>
    </div>
  );
};

export default ShoppingPage;