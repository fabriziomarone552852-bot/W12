// src/hooks/useShoppingData.ts
// Data fetching con React Query - segue il pattern di useAgendaHome
import { useQuery } from '@tanstack/react-query';
import { useShoppingApi } from '../api/shoppingApi';

export const useShoppingData = (filters?: {
  shopping_list_id?: number | null;
  is_purchased?: boolean | null;
}) => {
  const api = useShoppingApi();

  // Groups
  const { data: groups, isLoading: groupsLoading } = useQuery<unknown[]>({
    queryKey: ['shopping', 'groups'],
    queryFn: async () => {
      const data = await api.fetchGroups();
      return Array.isArray(data) ? data : [];
    },
  });

  // Lists
  const { data: lists, isLoading: listsLoading } = useQuery<unknown[]>({
    queryKey: ['shopping', 'lists'],
    queryFn: async () => {
      const data = await api.fetchLists();
      return Array.isArray(data) ? data : [];
    },
  });

  // Items (con filtri)
  const { data: items, isLoading: itemsLoading } = useQuery<unknown[]>({
    queryKey: ['shopping', 'items', filters?.shopping_list_id, filters?.is_purchased],
    queryFn: async () => {
      const data = await api.fetchItems({
        shopping_list_id: filters?.shopping_list_id ?? undefined,
        is_purchased: filters?.is_purchased ?? undefined,
      });
      return Array.isArray(data) ? data : [];
    },
  });

  // Suppliers
  const { data: suppliers, isLoading: suppliersLoading } = useQuery<unknown[]>({
    queryKey: ['shopping', 'suppliers'],
    queryFn: async () => {
      const data = await api.fetchSuppliers();
      return Array.isArray(data) ? data : [];
    },
  });

  // Group Members (per gruppo selezionato)
  const { data: members, isLoading: membersLoading } = useQuery<unknown[]>({
    queryKey: ['shopping', 'members', filters?.shopping_list_id],
    queryFn: async () => {
      // members si caricano on-demand dal componente, non qui
      return [];
    },
    enabled: false, // disabled di default, abilitato dal componente
  });

  return {
    groups: groups || [],
    lists: lists || [],
    items: items || [],
    suppliers: suppliers || [],
    members: members || [],
    isLoading: groupsLoading || listsLoading || itemsLoading || suppliersLoading,
    groupsLoading,
    listsLoading,
    itemsLoading,
    suppliersLoading,
    membersLoading,
  };
};
