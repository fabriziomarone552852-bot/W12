// src/components/shared/shopping/shoppingItems.utils.ts
import type {
  CatalogOption,
  ItemFormState,
  PurchaseFormState,
} from '../../../types/shopping';

export const emptyItemForm = (shoppingListId = ''): ItemFormState => ({
  shopping_list_id: shoppingListId,
  name_original: '',
  quantity: '',
  unit_id: '',
  notes: '',
  status_id: '',
});

export const emptyPurchaseForm = (defaultCurrencyId = ''): PurchaseFormState => ({
  supplier_id: '',
  price: '',
  purchase_date: new Date().toISOString().slice(0, 10),
  currency_id: defaultCurrencyId,
  offer_flag_id: '',
});

export const renderCatalogOptions = (options: CatalogOption[]) =>
  options.map((option) => (
    <option key={option.id} value={String(option.id)}>
      {option.code_name}
    </option>
  ));

export const getEurCurrencyId = (currencyOptions: CatalogOption[]): string =>
  currencyOptions.find(
    (option) =>
      option.code_value?.toUpperCase() === 'EUR' ||
      option.code_name?.toUpperCase() === 'EUR',
  )?.id?.toString() ?? '';