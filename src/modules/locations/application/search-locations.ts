import type { LocationRepository } from "./location-repository";

export function searchLocations({
  accountId,
  query,
  repository,
}: {
  accountId: string;
  query: string;
  repository: LocationRepository;
}) {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return [];
  }

  return repository.searchByName(accountId, trimmedQuery);
}
