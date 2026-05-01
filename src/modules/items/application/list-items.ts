import type { ItemRepository } from "./item-repository";
import type { ItemStatus } from "./types";

type ItemListStatus = ItemStatus | "all";

export function listItems({
  accountId,
  status = "active",
  handReceiptId,
  repository,
}: {
  accountId: string;
  status?: ItemListStatus;
  handReceiptId?: string;
  repository: ItemRepository;
}) {
  return repository.findByAccountId(accountId, {
    ...(status !== "all" ? { status } : {}),
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

export function listArchivedItemsByHandReceipt({
  accountId,
  handReceiptId,
  repository,
}: {
  accountId: string;
  handReceiptId: string;
  repository: ItemRepository;
}) {
  return repository.findByHandReceiptId(accountId, handReceiptId, {
    status: "archived",
  });
}
