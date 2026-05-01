import type { ItemRepository } from "./item-repository";

export function getItem({
  accountId,
  itemId,
  repository,
}: {
  accountId: string;
  itemId: string;
  repository: ItemRepository;
}) {
  return repository.findById(accountId, itemId);
}
