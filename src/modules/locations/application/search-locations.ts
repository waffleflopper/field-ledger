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
  return repository.searchByName(accountId, query);
}
