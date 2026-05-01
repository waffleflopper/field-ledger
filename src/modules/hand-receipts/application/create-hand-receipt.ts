import type { AccountRecord } from "@/modules/accounts/application/ensure-account";
import {
  canCreateHandReceipt,
  deriveAccountCapabilities,
} from "@/modules/billing";
import { recordAuditEvent, type AuditRepository } from "@/modules/audit";
import type { HandReceiptRepository } from "./hand-receipt-repository";
import type { HandReceiptMetadataInput } from "./types";

type CreateHandReceiptInput = {
  account: AccountRecord;
  actorId: string;
  input: HandReceiptMetadataInput & {
    name: string;
  };
  handReceiptRepository: HandReceiptRepository;
  auditRepository: AuditRepository;
  now?: Date;
  createHandReceiptId?: () => string;
};

function cleanOptionalText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function createHandReceipt({
  account,
  actorId,
  input,
  handReceiptRepository,
  auditRepository,
  now = new Date(),
  createHandReceiptId = () => globalThis.crypto.randomUUID(),
}: CreateHandReceiptInput) {
  const name = input.name.trim();

  if (!name) {
    throw new Error("Hand receipt name is required.");
  }

  const capabilities = deriveAccountCapabilities(account, now);
  const currentActiveCount = await handReceiptRepository.countActiveByAccountId(
    account.id,
  );

  if (!canCreateHandReceipt(capabilities, currentActiveCount)) {
    if (capabilities.isReadOnly) {
      throw new Error("This account is read-only.");
    }

    throw new Error("Active hand receipt limit reached.");
  }

  const handReceiptId = createHandReceiptId();
  const handReceipt = await handReceiptRepository.create({
    id: handReceiptId,
    accountId: account.id,
    name,
    notes: cleanOptionalText(input.notes),
    handReceiptNumber: cleanOptionalText(input.handReceiptNumber),
    holderName: cleanOptionalText(input.holderName),
    unitName: cleanOptionalText(input.unitName),
    uic: cleanOptionalText(input.uic),
    effectiveDate: cleanOptionalText(input.effectiveDate),
    status: "active",
    createdAt: now,
    updatedAt: now,
  });

  await recordAuditEvent({
    accountId: account.id,
    actorId,
    action: "hand_receipt.created",
    target: {
      type: "hand_receipt",
      id: handReceiptId,
    },
    metadata: {
      name,
    },
    occurredAt: now,
    repository: auditRepository,
  });

  return handReceipt;
}
