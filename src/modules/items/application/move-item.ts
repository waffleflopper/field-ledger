import type { AccountRecord } from "@/modules/accounts/application/ensure-account";
import { recordAuditEvent, type AuditRepository } from "@/modules/audit";
import { canMoveItem, deriveAccountCapabilities } from "@/modules/billing";
import type { HandReceiptRepository } from "@/modules/hand-receipts";
import type { ItemRepository } from "./item-repository";

type MoveItemInput = {
  account: AccountRecord;
  actorId: string;
  itemId: string;
  targetHandReceiptId: string;
  itemRepository: ItemRepository;
  handReceiptRepository: HandReceiptRepository;
  auditRepository: AuditRepository;
  hasActive2062Coverage?: (input: {
    accountId: string;
    itemId: string;
  }) => boolean | Promise<boolean>;
  now?: Date;
};

function defaultHasActive2062Coverage() {
  return false;
}

export async function moveItem({
  account,
  actorId,
  itemId,
  targetHandReceiptId,
  itemRepository,
  handReceiptRepository,
  auditRepository,
  hasActive2062Coverage = defaultHasActive2062Coverage,
  now = new Date(),
}: MoveItemInput) {
  const capabilities = deriveAccountCapabilities(account, now);

  if (!canMoveItem(capabilities)) {
    throw new Error("This account is read-only.");
  }

  const existing = await itemRepository.findById(account.id, itemId);

  if (!existing) {
    return null;
  }

  if (existing.status !== "active") {
    throw new Error("Cannot move an archived item.");
  }

  const sourceHandReceipt = await handReceiptRepository.findById(
    account.id,
    existing.handReceiptId,
  );

  if (!sourceHandReceipt) {
    return null;
  }

  if (sourceHandReceipt.status !== "active") {
    throw new Error("Cannot move item from an archived hand receipt.");
  }

  const targetHandReceipt = await handReceiptRepository.findById(
    account.id,
    targetHandReceiptId,
  );

  if (!targetHandReceipt) {
    return null;
  }

  if (targetHandReceipt.status !== "active") {
    throw new Error("Cannot move item to an archived hand receipt.");
  }

  if (targetHandReceiptId === existing.handReceiptId) {
    return existing;
  }

  if (await hasActive2062Coverage({ accountId: account.id, itemId })) {
    throw new Error("Cannot move item with active 2062 coverage.");
  }

  const updated = await itemRepository.update(account.id, itemId, {
    handReceiptId: targetHandReceiptId,
    updatedAt: now,
  });

  if (!updated) {
    return null;
  }

  await recordAuditEvent({
    accountId: account.id,
    actorId,
    action: "item.moved",
    target: {
      type: "item",
      id: itemId,
    },
    metadata: {
      name: existing.nomenclature,
      fromHandReceiptId: existing.handReceiptId,
      toHandReceiptId: targetHandReceiptId,
    },
    occurredAt: now,
    repository: auditRepository,
  });

  return updated;
}
