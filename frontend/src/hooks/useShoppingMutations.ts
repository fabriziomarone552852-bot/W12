// src/hooks/useShoppingMutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useShoppingApi } from '../api/shoppingApi';
import type {
  ListFormState,
  ItemFormState,
  SupplierFormState,
  PurchaseFormState,
  InviteFormState,
} from '../types/shopping';

export const useShoppingMutations = () => {
  const api = useShoppingApi();
  const queryClient = useQueryClient();

  // Invalida tutte le query shopping
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['shopping'] });
  };

  // ── Groups ──
  const createGroup = useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      api.createGroup(data.name, data.description),
    onSuccess: invalidateAll,
  });

  const updateGroup = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name?: string; description?: string | null } }) =>
      api.updateGroup(id, data),
    onSuccess: invalidateAll,
  });

  const deleteGroup = useMutation({
    mutationFn: (id: number) => api.deleteGroup(id),
    onSuccess: invalidateAll,
  });

  // ── Members ──
	const addMember = useMutation({
		mutationFn: ({ groupId, userId, roleId }: { groupId: number; userId: number; roleId: number }) =>
			api.addMember(groupId, userId, roleId),
		onSuccess: async (_data, vars) => {
			await queryClient.invalidateQueries({
				queryKey: ['shopping', 'groups', vars.groupId, 'members'],
			});
		},
	});

	const inviteMember = useMutation({
		mutationFn: ({ groupId, form }: { groupId: number; form: InviteFormState }) =>
			api.inviteMember(groupId, form),
		onSuccess: async (_data, vars) => {
			await queryClient.invalidateQueries({
				queryKey: ['shopping', 'groups', vars.groupId, 'members'],
			});
		},
	});

	const updateMemberRole = useMutation({
		mutationFn: ({ groupId, userId, roleCode }: { groupId: number; userId: number; roleCode: string }) =>
			api.updateMemberRole(groupId, userId, roleCode),
		onSuccess: async (_data, vars) => {
			await queryClient.invalidateQueries({
				queryKey: ['shopping', 'groups', vars.groupId, 'members'],
			});
		},
	});

	const removeMember = useMutation({
		mutationFn: ({ groupId, userId }: { groupId: number; userId: number }) =>
			api.removeMember(groupId, userId),
		onSuccess: async (_data, vars) => {
			await queryClient.invalidateQueries({
				queryKey: ['shopping', 'groups', vars.groupId, 'members'],
			});
		},
	});

  // ── Lists ──
  const createList = useMutation({
    mutationFn: (form: ListFormState) => api.createList(form),
    onSuccess: invalidateAll,
  });

  const updateList = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ListFormState> }) =>
      api.updateList(id, data),
    onSuccess: invalidateAll,
  });

  const deleteList = useMutation({
    mutationFn: (id: number) => api.deleteList(id),
    onSuccess: invalidateAll,
  });

  // ── Items ──
  const createItem = useMutation({
    mutationFn: (form: ItemFormState) => api.createItem(form),
    onSuccess: invalidateAll,
  });

  const updateItem = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ItemFormState> }) =>
      api.updateItem(id, data),
    onSuccess: invalidateAll,
  });

  const deleteItem = useMutation({
    mutationFn: (id: number) => api.deleteItem(id),
    onSuccess: invalidateAll,
  });

  // ── Suppliers ──
  const createSupplier = useMutation({
    mutationFn: (form: SupplierFormState) => api.createSupplier(form),
    onSuccess: invalidateAll,
  });

  const updateSupplier = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<SupplierFormState> }) =>
      api.updateSupplier(id, data),
    onSuccess: invalidateAll,
  });

  const deleteSupplier = useMutation({
    mutationFn: (id: number) => api.deleteSupplier(id),
    onSuccess: invalidateAll,
  });

  // ── Prices ──
  const addPrice = useMutation({
    mutationFn: ({ itemId, form }: { itemId: number; form: PurchaseFormState }) =>
      api.addPrice(itemId, form),
    onSuccess: invalidateAll,
  });

  const updatePrice = useMutation({
    mutationFn: ({ priceId, data }: { priceId: number; data: Partial<PurchaseFormState> }) =>
      api.updatePrice(priceId, data),
    onSuccess: invalidateAll,
  });

  const deletePrice = useMutation({
    mutationFn: (priceId: number) => api.deletePrice(priceId),
    onSuccess: invalidateAll,
  });

  return {
    // Groups
    createGroup: createGroup.mutateAsync,
    updateGroup: updateGroup.mutateAsync,
    deleteGroup: deleteGroup.mutateAsync,
    // Members
    addMember: addMember.mutateAsync,
    inviteMember: inviteMember.mutateAsync,
    updateMemberRole: updateMemberRole.mutateAsync,
    removeMember: removeMember.mutateAsync,
    // Lists
    createList: createList.mutateAsync,
    updateList: updateList.mutateAsync,
    deleteList: deleteList.mutateAsync,
    // Items
    createItem: createItem.mutateAsync,
    updateItem: updateItem.mutateAsync,
    deleteItem: deleteItem.mutateAsync,
    // Suppliers
    createSupplier: createSupplier.mutateAsync,
    updateSupplier: updateSupplier.mutateAsync,
    deleteSupplier: deleteSupplier.mutateAsync,
    // Prices
    addPrice: addPrice.mutateAsync,
    updatePrice: updatePrice.mutateAsync,
    deletePrice: deletePrice.mutateAsync,
  };
};
