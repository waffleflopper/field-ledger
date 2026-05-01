import type { AccountRecord } from "@/modules/accounts/application/ensure-account";
import { recordAuditEvent, type AuditRepository } from "@/modules/audit";
import { deriveAccountCapabilities } from "@/modules/billing";
import type { HandReceiptRepository } from "./hand-receipt-repository";
import type { HandReceiptMetadataInput, HandReceiptRecord } from "./types";

type UpdateHandReceiptInput = {
  account: AccountRecord;
  actorId: string;
  handReceiptId: string;
  input: HandReceiptMetadataInput & {
    name: string;
  };
  handReceiptRepository: HandReceiptRepository;
  auditRepository: AuditRepository;
  now?: Date;
};

function cleanOptionalText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function changedFields(
  current: HandReceiptRecord,
  next: {
    name: string;
    notes: string | null;
    handReceiptNumber: string | null;
    holderName: string | null;
    unitName: string | null;
    uic: string | null;
    effectiveDate: string | null;
  },
) {
  const fields = [
    "name",
    "notes",
    "handReceiptNumber",
    "holderName",
    "unitName",
    "uic",
    "effectiveDate",
  ] as const;

  return fields.filter((field) => current[field] !== next[field]);
}

export async function updateHandReceipt({
  account,
  actorId,
  handReceiptId,
  input,
  handReceiptRepository,
  auditRepository,
  now = new Date(),
}: UpdateHandReceiptInput) {
  const name = input.name.trim();

  if (!name) {
    throw new Error("Hand receipt name is required.");
  }

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

  const updates = {
    name,
    notes: cleanOptionalText(input.notes),
    handReceiptNumber: cleanOptionalText(input.handReceiptNumber),
    holderName: cleanOptionalText(input.holderName),
    unitName: cleanOptionalText(input.unitName),
    uic: cleanOptionalText(input.uic),
    effectiveDate: cleanOptionalText(input.effectiveDate),
  };
  const changedFieldNames = changedFields(existing, updates);

  if (changedFieldNames.length === 0) {
    return existing;
  }

  const updated = await handReceiptRepository.update(
    account.id,
    handReceiptId,
    {
      ...updates,
      updatedAt: now,
    },
  );

  if (!updated) {
    return null;
  }

  await recordAuditEvent({
    accountId: account.id,
    actorId,
    action: "hand_receipt.updated",
    target: {
      type: "hand_receipt",
      id: handReceiptId,
    },
    metadata: {
      changedFields: changedFieldNames,
    },
    occurredAt: now,
    repository: auditRepository,
  });

  return updated;
}
