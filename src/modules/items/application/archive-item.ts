import type { AccountRecord } from "@/modules/accounts/application/ensure-account";
import type { Active2062CoverageInfo } from "@/modules/assignments-2062";
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
  getActive2062CoverageInfo?: Active2062CoverageInfoLookup;
  closeActive2062ItemLink?: CloseActive2062ItemLink;
  now?: Date;
};

type ItemLifecycleTransition = {
  targetStatus: ItemStatus;
  alreadyInTargetMessage: string;
  auditAction: "item.archived" | "item.restored";
};

type Active2062CoverageInfoLookup = (input: {
  accountId: string;
  itemId: string;
}) => Active2062CoverageInfo | null | Promise<Active2062CoverageInfo | null>;

type CloseActive2062ItemLink = (input: {
  itemLinkId: string;
  now: Date;
}) => unknown | Promise<unknown>;

function defaultGetActive2062CoverageInfo() {
  return null;
}

async function changeItemLifecycleStatus({
  account,
  actorId,
  itemId,
  itemRepository,
  auditRepository,
  getActive2062CoverageInfo = defaultGetActive2062CoverageInfo,
  closeActive2062ItemLink,
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

  const active2062Coverage =
    transition.targetStatus === "archived"
      ? await getActive2062CoverageInfo({ accountId: account.id, itemId })
      : null;

  if (active2062Coverage && !closeActive2062ItemLink) {
    throw new Error("Active 2062 link closure is unavailable.");
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

  if (active2062Coverage) {
    await closeActive2062ItemLink?.({
      itemLinkId: active2062Coverage.itemLinkId,
      now,
    });

    return (await itemRepository.findById(account.id, itemId)) ?? updated;
  }

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
