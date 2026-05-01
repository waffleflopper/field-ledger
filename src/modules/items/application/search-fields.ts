import type { SearchableItemField } from "./types";

export type SearchableItemValues = Record<
  SearchableItemField,
  string | null | undefined
>;

const searchableItemFields: SearchableItemField[] = [
  "ecn",
  "serialNumber",
  "generatedId",
  "nomenclature",
  "handReceiptName",
  "contact",
  "location",
];

export function normalizeItemSearchQuery(query: string) {
  return query.trim().toLocaleLowerCase();
}

export function getMatchedItemSearchFields(
  values: SearchableItemValues,
  normalizedQuery: string,
) {
  if (normalizedQuery.length === 0) {
    return [];
  }

  return searchableItemFields.filter(
    (field) =>
      values[field]?.toLocaleLowerCase().includes(normalizedQuery) ?? false,
  );
}
