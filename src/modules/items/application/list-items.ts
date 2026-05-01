import type { ItemRepository } from "./item-repository";
import type { ItemStatus } from "./types";

export function listItems({
  accountId,
  status,
  handReceiptId,
  repository,
}: {
  accountId: string;
  status?: ItemStatus;
  handReceiptId?: string;
  repository: ItemRepository;
}) {
  return repository.findByAccountId(accountId, {
    ...(status ? { status } : {}),
    ...(handReceiptId ? { handReceiptId } : {}),
  });
}

export function listActiveItemsByHandReceipt({
  accountId,
  handReceiptId,
  repository,
}: {
  accountId: string;
  handReceiptId: string;
  repository: ItemRepository;
}) {
  return repository.findByHandReceiptId(accountId, handReceiptId, {
    status: "active",
  });
}
