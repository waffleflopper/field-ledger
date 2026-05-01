import type { LocationRepository } from "./location-repository";

export function listLocations({
  accountId,
  repository,
}: {
  accountId: string;
  repository: LocationRepository;
}) {
  return repository.findByAccountId(accountId);
}
