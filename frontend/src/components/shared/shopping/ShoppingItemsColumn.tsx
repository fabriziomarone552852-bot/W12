// src/components/shared/shopping/ShoppingItemsColumn.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useShoppingMutations } from '../../../hooks/useShoppingMutations';
import { useModal } from '../../../hooks/useModals';
import { useDebounce } from '../../../hooks/useDebounce';
import type {
  CatalogOption,
  ItemFormState,
  PurchaseFormState,
  ShoppingList,
  ShoppingListItem,
  ShoppingSupplier,
} from '../../../types/shopping';
import { shoppingCardClass } from './shoppingUi';
import {
  emptyItemForm,
  emptyPurchaseForm,
  getEurCurrencyId,
} from './shoppingItems.utils';
import ShoppingItemCreateModal from './ShoppingItemCreateModal';
import ShoppingItemEditModal from './ShoppingItemEditModal';
import ShoppingPurchaseModal from './ShoppingPurchaseModal';
import ShoppingItemsToolbar from './ShoppingItemsToolbar';
import ShoppingItemsList from './ShoppingItemsList';
import ShoppingQuickAddBar from './ShoppingQuickAddBar';

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

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const editModal = useModal<ShoppingListItem>();
  const purchaseModal = useModal<ShoppingListItem>();

  const [filtroStato, setFiltroStato] = useState<'tutti' | 'aperti' | 'completati'>('tutti');
  const [filtroNome, setFiltroNome] = useState('');
  const debouncedNome = useDebounce(filtroNome);

  const [itemForm, setItemForm] = useState<ItemFormState>(emptyItemForm());
  const [editForm, setEditForm] = useState<ItemFormState>(emptyItemForm());
  const [purchaseForm, setPurchaseForm] = useState<PurchaseFormState>(emptyPurchaseForm());

  const [quickName, setQuickName] = useState('');
  const [quickQuantity, setQuickQuantity] = useState('');
  const [quickUnitId, setQuickUnitId] = useState('');
  const [quickAdding, setQuickAdding] = useState(false);

  const eurCurrencyId = useMemo(
    () => getEurCurrencyId(currencyOptions),
    [currencyOptions],
  );

  useEffect(() => {
    if (!eurCurrencyId) return;

    setPurchaseForm((prev) =>
      prev.currency_id ? prev : { ...prev, currency_id: eurCurrencyId }
    );
  }, [eurCurrencyId]);

  const filteredItems = useMemo(() => {
    let result = items;

    if (filtroStato === 'aperti') {
      result = result.filter((item) => !item.is_purchased);
    }

    if (filtroStato === 'completati') {
      result = result.filter((item) => item.is_purchased);
    }

    const nome = debouncedNome.trim().toLowerCase();
    if (nome) {
      result = result.filter((item) =>
        item.name_original.toLowerCase().includes(nome),
      );
    }

    return result;
  }, [items, filtroStato, debouncedNome]);

  const currentListName =
    lists.find((list) => String(list.id) === activeListId)?.name ?? 'Tutte le liste';

  const buildCreateForm = (): ItemFormState => ({
    ...emptyItemForm(),
    shopping_list_id: activeListId || '',
  });

  const resetQuickAdd = () => {
    setQuickName('');
    setQuickQuantity('');
    setQuickUnitId('');
  };

  const handleOpenCreate = () => {
    setItemForm(buildCreateForm());
    setIsCreateOpen(true);
  };

  const handleCloseCreate = () => {
    setItemForm(buildCreateForm());
    setIsCreateOpen(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.name_original.trim()) return;
    if (!itemForm.shopping_list_id) return;

    await mutations.createItem({
      shopping_list_id: Number(itemForm.shopping_list_id),
      name_original: itemForm.name_original.trim(),
      quantity: itemForm.quantity ? Number(itemForm.quantity) : undefined,
      unit_id: itemForm.unit_id ? Number(itemForm.unit_id) : undefined,
      notes: itemForm.notes?.trim() || undefined,
    });

    handleCloseCreate();
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeListId) return;
    if (!quickName.trim()) return;

    setQuickAdding(true);
    try {
      await mutations.createItem({
        shopping_list_id: Number(activeListId),
        name_original: quickName.trim(),
        quantity: quickQuantity ? Number(quickQuantity) : undefined,
        unit_id: quickUnitId ? Number(quickUnitId) : undefined,
        notes: undefined,
      });
      resetQuickAdd();
    } finally {
      setQuickAdding(false);
    }
  };

  const handleOpenEdit = (item: ShoppingListItem) => {
    setEditForm({
      shopping_list_id: String(item.shopping_list_id ?? ''),
      name_original: item.name_original ?? '',
      quantity: item.quantity != null ? String(item.quantity) : '',
      unit_id: item.unit_id != null ? String(item.unit_id) : '',
      status_id: item.status_id != null ? String(item.status_id) : '',
      notes: item.notes ?? '',
    });
    editModal.open(item);
  };

  const handleCloseEdit = () => {
    setEditForm(emptyItemForm());
    editModal.close();
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal.data) return;

    await mutations.updateItem(editModal.data.id, {
      shopping_list_id: editForm.shopping_list_id
        ? Number(editForm.shopping_list_id)
        : undefined,
      name_original: editForm.name_original.trim() || undefined,
      quantity: editForm.quantity ? Number(editForm.quantity) : undefined,
      unit_id: editForm.unit_id ? Number(editForm.unit_id) : undefined,
      notes: editForm.notes?.trim() || undefined,
    });

    handleCloseEdit();
  };

  const handleDelete = async (itemId: number) => {
    await mutations.deleteItem(itemId);
  };

  const handleTogglePurchased = async (item: ShoppingListItem) => {
    await mutations.updateItem(item.id, {
      is_purchased: !item.is_purchased,
    });
  };

  const handleOpenPurchase = (item: ShoppingListItem) => {
    setPurchaseForm({
      ...emptyPurchaseForm(eurCurrencyId),
      purchase_date: new Date().toISOString().slice(0, 10),
    });
    purchaseModal.open(item);
  };

  const handleClosePurchase = () => {
    setPurchaseForm(emptyPurchaseForm(eurCurrencyId));
    purchaseModal.close();
  };

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseModal.data) return;

    await mutations.addPrice({
      itemId: purchaseModal.data.id,
      form: {
        supplier_id: purchaseForm.supplier_id || undefined,
        price: purchaseForm.price,
        purchase_date: purchaseForm.purchase_date,
        currency_id: purchaseForm.currency_id,
        offer_flag_id: purchaseForm.offer_flag_id || undefined,
      },
    });

    handleClosePurchase();
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <ShoppingItemsToolbar
        currentListName={currentListName}
        activeListId={activeListId}
        filtroNome={filtroNome}
        filtroStato={filtroStato}
        onFiltroNomeChange={setFiltroNome}
        onFiltroStatoChange={setFiltroStato}
        onAddItem={handleOpenCreate}
      />

      <ShoppingQuickAddBar
        activeListId={activeListId}
        unitOptions={unitOptions}
        quickName={quickName}
        quickQuantity={quickQuantity}
        quickUnitId={quickUnitId}
        onQuickNameChange={setQuickName}
        onQuickQuantityChange={setQuickQuantity}
        onQuickUnitChange={setQuickUnitId}
        onSubmit={handleQuickAdd}
        loading={quickAdding}
      />

      <div className={`${shoppingCardClass} min-h-0 flex-1 overflow-hidden p-0`}>
        <ShoppingItemsList
          items={filteredItems}
          loading={loading}
          containerRef={containerRef}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
          onToggle={handleTogglePurchased}
        />
      </div>

      <ShoppingItemCreateModal
        open={isCreateOpen}
        onClose={handleCloseCreate}
        onSubmit={handleCreate}
        itemForm={itemForm}
        setItemForm={setItemForm}
        activeListId={activeListId}
        lists={lists}
        unitOptions={unitOptions}
      />

      <ShoppingItemEditModal
        open={editModal.isOpen}
        onClose={handleCloseEdit}
        onSubmit={handleEdit}
        editForm={editForm}
        setEditForm={setEditForm}
        lists={lists}
        unitOptions={unitOptions}
        itemStatusOptions={itemStatusOptions}
      />

      <ShoppingPurchaseModal
        open={purchaseModal.isOpen}
        onClose={handleClosePurchase}
        onSubmit={handlePurchase}
        purchaseForm={purchaseForm}
        setPurchaseForm={setPurchaseForm}
        suppliers={suppliers}
        currencyOptions={currencyOptions}
        offerFlagOptions={offerFlagOptions}
        itemName={purchaseModal.data?.name_original ?? ''}
      />
    </div>
  );
};

export default ShoppingItemsColumn;