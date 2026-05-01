import type { AccountRecord } from "@/modules/accounts/application/ensure-account";
import { recordAuditEvent, type AuditRepository } from "@/modules/audit";
import { deriveAccountCapabilities } from "@/modules/billing";
import type { ItemRepository } from "./item-repository";

type LifecycleItemInput = {
  account: AccountRecord;
  actorId: string;
  itemId: string;
  itemRepository: ItemRepository;
  auditRepository: AuditRepository;
  now?: Date;
};

export async function archiveItem({
  account,
  actorId,
  itemId,
  itemRepository,
  auditRepository,
  now = new Date(),
}: LifecycleItemInput) {
  const capabilities = deriveAccountCapabilities(account, now);

  if (capabilities.isReadOnly) {
    throw new Error("This account is read-only.");
  }

  const existing = await itemRepository.findById(account.id, itemId);

  if (!existing) {
    return null;
  }

  if (existing.status === "archived") {
    throw new Error("Item is already archived.");
  }

  const archived = await itemRepository.update(account.id, itemId, {
    status: "archived",
    updatedAt: now,
  });

  if (!archived) {
    return null;
  }

  await recordAuditEvent({
    accountId: account.id,
    actorId,
    action: "item.archived",
    target: {
      type: "item",
      id: itemId,
    },
    metadata: {
      name: existing.nomenclature,
      handReceiptId: existing.handReceiptId,
    },
    occurredAt: now,
    repository: auditRepository,
  });

  return archived;
}

export async function restoreItem({
  account,
  actorId,
  itemId,
  itemRepository,
  auditRepository,
  now = new Date(),
}: LifecycleItemInput) {
  const capabilities = deriveAccountCapabilities(account, now);

  if (capabilities.isReadOnly) {
    throw new Error("This account is read-only.");
  }

  const existing = await itemRepository.findById(account.id, itemId);

  if (!existing) {
    return null;
  }

  if (existing.status === "active") {
    throw new Error("Item is already active.");
  }

  const restored = await itemRepository.update(account.id, itemId, {
    status: "active",
    updatedAt: now,
  });

  if (!restored) {
    return null;
  }

  await recordAuditEvent({
    accountId: account.id,
    actorId,
    action: "item.restored",
    target: {
      type: "item",
      id: itemId,
    },
    metadata: {
      name: existing.nomenclature,
      handReceiptId: existing.handReceiptId,
    },
    occurredAt: now,
    repository: auditRepository,
  });

  return restored;
}
