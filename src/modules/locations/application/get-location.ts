import type { LocationRepository } from "./location-repository";

export function getLocation({
  accountId,
  locationId,
  repository,
}: {
  accountId: string;
  locationId: string;
  repository: LocationRepository;
}) {
  return repository.findById(accountId, locationId);
}
