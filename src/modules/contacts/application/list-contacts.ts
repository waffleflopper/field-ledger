import type { ContactRepository } from "./contact-repository";

export function listContacts({
  accountId,
  repository,
}: {
  accountId: string;
  repository: ContactRepository;
}) {
  return repository.findByAccountId(accountId);
}
