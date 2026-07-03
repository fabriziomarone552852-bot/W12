// src/views/ShoppingPage.tsx
import React, { useMemo, useState } from 'react';
import { useShoppingData } from '../hooks/useShoppingData';
import ShoppingGroupsColumn from '../components/shared/shopping/ShoppingGroupsColumn';
import ShoppingListsColumn from '../components/shared/shopping/ShoppingListsColumn';
import ShoppingItemsColumn from '../components/shared/shopping/ShoppingItemsColumn';
import ShoppingSuppliersColumn from '../components/shared/shopping/ShoppingSuppliersColumn';
import { shoppingCardClass } from '../components/shared/shopping/shoppingUi';
import type { ShoppingList } from '../types/shopping';

const ShoppingPage: React.FC = () => {
  const [activeListId, setActiveListId] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

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