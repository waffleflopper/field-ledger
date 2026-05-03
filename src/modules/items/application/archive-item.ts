import type { AccountRecord } from "@/modules/accounts/application/ensure-account";
import { recordAuditEvent, type AuditRepository } from "@/modules/audit";
import { deriveAccountCapabilities } from "@/modules/billing";
import type { ItemRepository } from "./item-repository";
import type { ItemStatus } from "./types";

type LifecycleItemInput = {
  account: AccountRecord;
  actorId: string;
  itemId: string;
  itemRepository: ItemRepository;
  auditRepository: AuditRepository;
  hasActive2062Coverage?: Active2062CoverageLookup;
  now?: Date;
};

type ItemLifecycleTransition = {
  targetStatus: ItemStatus;
  alreadyInTargetMessage: string;
  auditAction: "item.archived" | "item.restored";
};

type Active2062CoverageLookup = (input: {
  accountId: string;
  itemId: string;
}) => boolean | Promise<boolean>;

function defaultHasActive2062Coverage() {
  return false;
}

async function changeItemLifecycleStatus({
  account,
  actorId,
  itemId,
  itemRepository,
  auditRepository,
  hasActive2062Coverage = defaultHasActive2062Coverage,
  now = new Date(),
  transition,
}: LifecycleItemInput & { transition: ItemLifecycleTransition }) {
  const capabilities = deriveAccountCapabilities(account, now);

  if (capabilities.isReadOnly) {
    throw new Error("This account is read-only.");
  }

  const existing = await itemRepository.findById(account.id, itemId);

  if (!existing) {
    return null;
  }

  if (existing.status === transition.targetStatus) {
    throw new Error(transition.alreadyInTargetMessage);
  }

  if (
    transition.targetStatus === "archived" &&
    (await hasActive2062Coverage({ accountId: account.id, itemId }))
  ) {
    throw new Error(
      "Cannot archive item with active 2062 coverage until the active link is closed.",
    );
  }

  const updated = await itemRepository.update(account.id, itemId, {
    status: transition.targetStatus,
    updatedAt: now,
  });

  if (!updated) {
    return null;
  }

  await recordAuditEvent({
    accountId: account.id,
    actorId,
    action: transition.auditAction,
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

  return updated;
}

export function archiveItem(input: LifecycleItemInput) {
  return changeItemLifecycleStatus({
    ...input,
    transition: {
      targetStatus: "archived",
      alreadyInTargetMessage: "Item is already archived.",
      auditAction: "item.archived",
    },
  });
}

export function restoreItem(input: LifecycleItemInput) {
  return changeItemLifecycleStatus({
    ...input,
    transition: {
      targetStatus: "active",
      alreadyInTargetMessage: "Item is already active.",
      auditAction: "item.restored",
    },
  });
}
