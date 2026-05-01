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
    return [];
  }

  return repository.searchByName(accountId, trimmedQuery);
}
