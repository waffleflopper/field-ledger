import type { AccountRecord } from "@/modules/accounts/application/ensure-account";
import { recordAuditEvent, type AuditRepository } from "@/modules/audit";
import {
  canArchiveHandReceipt,
  canRestoreHandReceipt,
  deriveAccountCapabilities,
} from "@/modules/billing";
import type { HandReceiptRepository } from "./hand-receipt-repository";

type LifecycleHandReceiptInput = {
  account: AccountRecord;
  actorId: string;
  handReceiptId: string;
  handReceiptRepository: HandReceiptRepository;
  auditRepository: AuditRepository;
  now?: Date;
};

export async function archiveHandReceipt({
  account,
  actorId,
  handReceiptId,
  handReceiptRepository,
  auditRepository,
  now = new Date(),
}: LifecycleHandReceiptInput) {
  const capabilities = deriveAccountCapabilities(account, now);

  if (!canArchiveHandReceipt(capabilities)) {
    throw new Error("This account is read-only.");
  }

  const existing = await handReceiptRepository.findById(
    account.id,
    handReceiptId,
  );

  if (!existing) {
    return null;
  }

  if (existing.status === "archived") {
    throw new Error("Hand receipt is already archived.");
  }

  const archived = await handReceiptRepository.update(
    account.id,
    handReceiptId,
    {
      name: existing.name,
      status: "archived",
      updatedAt: now,
    },
  );

  if (!archived) {
    return null;
  }

  await recordAuditEvent({
    accountId: account.id,
    actorId,
    action: "hand_receipt.archived",
    target: {
      type: "hand_receipt",
      id: handReceiptId,
    },
    metadata: {
      name: existing.name,
    },
    occurredAt: now,
    repository: auditRepository,
  });

  return archived;
}

export async function restoreHandReceipt({
  account,
  actorId,
  handReceiptId,
  handReceiptRepository,
  auditRepository,
  now = new Date(),
}: LifecycleHandReceiptInput) {
  const capabilities = deriveAccountCapabilities(account, now);

  if (capabilities.isReadOnly) {
    throw new Error("This account is read-only.");
  }

  const existing = await handReceiptRepository.findById(
    account.id,
    handReceiptId,
  );

  if (!existing) {
    return null;
  }

  if (existing.status === "active") {
    throw new Error("Hand receipt is already active.");
  }

  const currentActiveCount = await handReceiptRepository.countActiveByAccountId(
    account.id,
  );

  if (!canRestoreHandReceipt(capabilities, currentActiveCount)) {
    throw new Error("Active hand receipt limit reached.");
  }

  const restored = await handReceiptRepository.update(
    account.id,
    handReceiptId,
    {
      name: existing.name,
      status: "active",
      updatedAt: now,
    },
  );

  if (!restored) {
    return null;
  }

  await recordAuditEvent({
    accountId: account.id,
    actorId,
    action: "hand_receipt.restored",
    target: {
      type: "hand_receipt",
      id: handReceiptId,
    },
    metadata: {
      name: existing.name,
    },
    occurredAt: now,
    repository: auditRepository,
  });

  return restored;
}
