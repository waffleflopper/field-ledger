import type { AccountRecord } from "@/modules/accounts/application/ensure-account";
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
  now?: Date;
};

export async function archiveHandReceipt({
  account,
  actorId,
  handReceiptId,
  handReceiptRepository,
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

  return handReceiptRepository.updateWithAuditEvent(
    account.id,
    handReceiptId,
    {
      name: existing.name,
      status: "archived",
      updatedAt: now,
    },
    {
      accountId: account.id,
      actorId,
      action: "hand_receipt.archived",
      targetType: "hand_receipt",
      targetId: handReceiptId,
      metadata: {
        name: existing.name,
      },
      occurredAt: now,
    },
  );
}

export async function restoreHandReceipt({
  account,
  actorId,
  handReceiptId,
  handReceiptRepository,
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

  return handReceiptRepository.updateWithAuditEvent(
    account.id,
    handReceiptId,
    {
      name: existing.name,
      status: "active",
      updatedAt: now,
    },
    {
      accountId: account.id,
      actorId,
      action: "hand_receipt.restored",
      targetType: "hand_receipt",
      targetId: handReceiptId,
      metadata: {
        name: existing.name,
      },
      occurredAt: now,
    },
  );
}
