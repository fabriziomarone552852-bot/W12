// src/hooks/useShoppingData.ts
import { useQuery } from '@tanstack/react-query';
import { useShoppingApi } from '../api/shoppingApi';
import type {
  CatalogOption,
  ShoppingGroup,
  ShoppingGroupMember,
  ShoppingList,
  ShoppingListItem,
  ShoppingSupplier,
} from '../types/shopping';

export interface UseShoppingDataFilters {
  shopping_list_id?: number | null;
  is_purchased?: boolean | null;
  group_id?: number | null;
}

export const useShoppingData = (filters?: UseShoppingDataFilters) => {
  const api = useShoppingApi();

  const { data: groups = [], isLoading: groupsLoading } = useQuery<ShoppingGroup[]>({
    queryKey: ['shopping', 'groups'],
    queryFn: async () => {
      const data = await api.fetchGroups();
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: lists = [], isLoading: listsLoading } = useQuery<ShoppingList[]>({
    queryKey: ['shopping', 'lists'],
    queryFn: async () => {
      const data = await api.fetchLists();
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: items = [], isLoading: itemsLoading } = useQuery<ShoppingListItem[]>({
    queryKey: [
      'shopping',
      'items',
      filters?.shopping_list_id ?? null,
      filters?.is_purchased ?? null,
    ],
    queryFn: async () => {
      const data = await api.fetchItems({
        shopping_list_id: filters?.shopping_list_id ?? undefined,
        is_purchased: filters?.is_purchased ?? undefined,
      });
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: suppliers = [], isLoading: suppliersLoading } = useQuery<ShoppingSupplier[]>({
    queryKey: ['shopping', 'suppliers'],
    queryFn: async () => {
      const data = await api.fetchSuppliers();
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: groupRoleOptions = [], isLoading: groupRoleOptionsLoading } = useQuery<CatalogOption[]>({
    queryKey: ['shopping', 'catalogs', 'group-role'],
    queryFn: async () => {
      const data = await api.fetchGroupRoleOptions();
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: listVisibilityOptions = [], isLoading: listVisibilityOptionsLoading } = useQuery<CatalogOption[]>({
    queryKey: ['shopping', 'catalogs', 'list-visibility'],
    queryFn: async () => {
      const data = await api.fetchListVisibilityOptions();
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: listStatusOptions = [], isLoading: listStatusOptionsLoading } = useQuery<CatalogOption[]>({
    queryKey: ['shopping', 'catalogs', 'list-status'],
    queryFn: async () => {
      const data = await api.fetchListStatusOptions();
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: itemStatusOptions = [], isLoading: itemStatusOptionsLoading } = useQuery<CatalogOption[]>({
    queryKey: ['shopping', 'catalogs', 'item-status'],
    queryFn: async () => {
      const data = await api.fetchItemStatusOptions();
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: unitOptions = [], isLoading: unitOptionsLoading } = useQuery<CatalogOption[]>({
    queryKey: ['shopping', 'catalogs', 'unit'],
    queryFn: async () => {
      const data = await api.fetchUnitOptions();
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: currencyOptions = [], isLoading: currencyOptionsLoading } = useQuery<CatalogOption[]>({
    queryKey: ['shopping', 'catalogs', 'currency'],
    queryFn: async () => {
      const data = await api.fetchCurrencyOptions();
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: offerFlagOptions = [], isLoading: offerFlagOptionsLoading } = useQuery<CatalogOption[]>({
    queryKey: ['shopping', 'catalogs', 'offer-flag'],
    queryFn: async () => {
      const data = await api.fetchOfferFlagOptions();
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: supplierStatusOptions = [], isLoading: supplierStatusOptionsLoading } = useQuery<CatalogOption[]>({
    queryKey: ['shopping', 'catalogs', 'supplier-status'],
    queryFn: async () => {
      const data = await api.fetchSupplierStatusOptions();
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: members = [], isLoading: membersLoading } = useQuery<ShoppingGroupMember[]>({
    queryKey: ['shopping', 'groups', filters?.group_id ?? null, 'members'],
    queryFn: async () => {
      if (filters?.group_id == null) return [];
      const data = await api.fetchMembers(filters.group_id);
      return Array.isArray(data) ? data : [];
    },
    enabled: filters?.group_id != null,
  });

  return {
    groups,
    lists,
    items,
    suppliers,
    members,

    groupRoleOptions,
    listVisibilityOptions,
    listStatusOptions,
    itemStatusOptions,
    unitOptions,
    currencyOptions,
    offerFlagOptions,
    supplierStatusOptions,

    isLoading:
      groupsLoading ||
      listsLoading ||
      itemsLoading ||
      suppliersLoading ||
      groupRoleOptionsLoading ||
      listVisibilityOptionsLoading ||
      listStatusOptionsLoading ||
      itemStatusOptionsLoading ||
      unitOptionsLoading ||
      currencyOptionsLoading ||
      offerFlagOptionsLoading ||
      supplierStatusOptionsLoading ||
      (filters?.group_id != null && membersLoading),

    groupsLoading,
    listsLoading,
    itemsLoading,
    suppliersLoading,
    membersLoading,

    groupRoleOptionsLoading,
    listVisibilityOptionsLoading,
    listStatusOptionsLoading,
    itemStatusOptionsLoading,
    unitOptionsLoading,
    currencyOptionsLoading,
    offerFlagOptionsLoading,
    supplierStatusOptionsLoading,
  };
};