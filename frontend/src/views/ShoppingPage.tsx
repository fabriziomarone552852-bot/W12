// src/views/ShoppingPage.tsx
import React, { useState, useMemo } from 'react';
import { useShoppingData } from '../hooks/useShoppingData';
import ShoppingGroupsColumn from '../components/shared/shopping/ShoppingGroupsColumn';
import ShoppingListsColumn from '../components/shared/shopping/ShoppingListsColumn';
import ShoppingItemsColumn from '../components/shared/shopping/ShoppingItemsColumn';
import ShoppingSuppliersColumn from '../components/shared/shopping/ShoppingSuppliersColumn';

const ShoppingPage: React.FC = () => {
  const [activeListId, setActiveListId] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

  const filters = useMemo(() => ({
    shopping_list_id: activeListId ? Number(activeListId) : null,
  }), [activeListId]);

  const {
    groups,
    lists,
    items,
    suppliers,
    isLoading,
  } = useShoppingData(filters);

  return (
    <div className="flex flex-col gap-4 max-w-[1800px] mx-auto min-h-full xl:h-full xl:overflow-hidden p-4 md:p-6">
      <div className="shrink-0">
        <h1 className="text-xl font-bold text-gray-800">Shopping</h1>
        <p className="text-sm text-gray-500">Gestione liste spesa, gruppi condivisi, fornitori e prezzi</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[280px_280px_minmax(0,1fr)_280px] gap-4 flex-1 xl:min-h-0">
        {/* Colonna 1: Gruppi */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col h-full min-h-0">
          <ShoppingGroupsColumn
            onSelectGroup={setSelectedGroupId}
            selectedGroupId={selectedGroupId}
          />
        </div>

        {/* Colonna 2: Liste */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col h-full min-h-0">
          <ShoppingListsColumn
            lists={lists as any[]}
            loadingLists={isLoading}
            activeListId={activeListId}
            setActiveListId={setActiveListId}
            groups={groups as any[]}
          />
        </div>

        {/* Colonna 3: Items */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col h-full min-h-0">
          <ShoppingItemsColumn
            items={items as any[]}
            lists={lists as any[]}
            loading={isLoading}
            activeListId={activeListId}
          />
        </div>

        {/* Colonna 4: Fornitori */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col h-full min-h-0">
          <ShoppingSuppliersColumn
            suppliers={suppliers as any[]}
          />
        </div>
      </div>
    </div>
  );
};

export default ShoppingPage;
