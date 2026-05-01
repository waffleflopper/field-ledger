import type { AccountRecord } from "@/modules/accounts/application/ensure-account";
import type { AccountRepository } from "@/modules/accounts/application/ensure-account";
import { recordAuditEvent, type AuditRepository } from "@/modules/audit";
import { deriveAccountCapabilities } from "@/modules/billing";
import type { HandReceiptRepository } from "@/modules/hand-receipts";
import { checkDuplicateIdentifiers } from "./check-duplicate-identifiers";
import { allocateGeneratedId } from "./generated-id";
import type { ItemRepository } from "./item-repository";
import type { CreateItemResult } from "./types";

type CreateItemInput = {
  account: AccountRecord;
  actorId: string;
  input: {
    handReceiptId: string;
    nomenclature: string;
    ecn?: string | null;
    serialNumber?: string | null;
    notes?: string | null;
    generateFieldLedgerId?: boolean;
    confirmDuplicate?: boolean;
  };
  itemRepository: ItemRepository;
  handReceiptRepository: HandReceiptRepository;
  accountRepository: Pick<AccountRepository, "incrementAndGetNextItemSequence">;
  auditRepository: AuditRepository;
  now?: Date;
  createItemId?: () => string;
};

function cleanOptionalText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function createItem({
  account,
  actorId,
  input,
  itemRepository,
  handReceiptRepository,
  accountRepository,
  auditRepository,
  now = new Date(),
  createItemId = () => globalThis.crypto.randomUUID(),
}: CreateItemInput): Promise<CreateItemResult> {
  const capabilities = deriveAccountCapabilities(account, now);

  if (capabilities.isReadOnly) {
    throw new Error("This account is read-only.");
  }

  const nomenclature = input.nomenclature.trim();
  const ecn = cleanOptionalText(input.ecn);
  const serialNumber = cleanOptionalText(input.serialNumber);
  const notes = cleanOptionalText(input.notes);

  if (!nomenclature) {
    throw new Error("Item nomenclature is required.");
  }

  if (!ecn && !serialNumber && !input.generateFieldLedgerId) {
    throw new Error("Provide an ECN, serial number, or generated ID.");
  }

  const handReceipt = await handReceiptRepository.findById(
    account.id,
    input.handReceiptId,
  );

  if (!handReceipt) {
    throw new Error("Hand receipt was not found.");
  }

  if (handReceipt.status !== "active") {
    throw new Error("Hand receipt is not active.");
  }

  const duplicateWarning = await checkDuplicateIdentifiers({
    accountId: account.id,
    ecn,
    serialNumber,
    repository: itemRepository,
  });

  if (duplicateWarning.hasDuplicate && !input.confirmDuplicate) {
    return { duplicateWarning };
  }

  const generatedId =
    input.generateFieldLedgerId || (!ecn && !serialNumber)
      ? await allocateGeneratedId({
          accountId: account.id,
          accountRepository,
        })
      : null;
  const itemId = createItemId();
  const item = await itemRepository.create({
    id: itemId,
    accountId: account.id,
    handReceiptId: input.handReceiptId,
    nomenclature,
    ecn,
    serialNumber,
    generatedId,
    notes,
    status: "active",
    createdAt: now,
    updatedAt: now,
  });

  await recordAuditEvent({
    accountId: account.id,
    actorId,
    action: "item.created",
    target: {
      type: "item",
      id: itemId,
    },
    metadata: {
      handReceiptId: input.handReceiptId,
      nomenclature,
      identifiers: {
        ecn,
        serialNumber,
        generatedId,
      },
    },
    occurredAt: now,
    repository: auditRepository,
  });

  return { item };
}
