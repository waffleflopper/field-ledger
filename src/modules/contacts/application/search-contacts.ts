import type { ContactRepository } from "./contact-repository";

export function searchContacts({
  accountId,
  query,
  repository,
}: {
  accountId: string;
  query: string;
  repository: ContactRepository;
}) {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return Promise.resolve([]);
  }

  return repository.searchByName(accountId, trimmedQuery);
}
