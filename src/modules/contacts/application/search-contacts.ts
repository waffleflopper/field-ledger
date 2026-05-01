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
  return repository.searchByName(accountId, query.trim());
}
