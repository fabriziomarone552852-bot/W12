// Re-export from centralized types for backward compatibility
// I nuovi componenti importano direttamente da ../../../types/shopping
export type {
  CatalogOption,
  ShoppingGroup,
  ShoppingGroupMember,
  ShoppingList,
  ShoppingListItem,
  ShoppingPrice,
  ShoppingSupplier,
  ListFormState,
  ItemFormState,
  SupplierFormState,
  PurchaseFormState,
  InviteFormState,
} from '../../../types/shopping';