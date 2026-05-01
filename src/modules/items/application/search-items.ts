import type { ItemRepository } from "./item-repository";
import { normalizeItemSearchQuery } from "./search-fields";
import type { ItemSearchResult } from "./types";

export async function searchItems({
  accountId,
  includeArchived = false,
  query,
  repository,
}: {
  accountId: string;
  includeArchived?: boolean;
  query: string;
  repository: ItemRepository;
}): Promise<ItemSearchResult[]> {
  const trimmedQuery = normalizeItemSearchQuery(query);

  if (trimmedQuery.length === 0) {
    return [];
  }

  return repository.search(accountId, {
    query: trimmedQuery,
    includeArchived,
  });
}
