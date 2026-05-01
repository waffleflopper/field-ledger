import type { AccountRecord } from "@/modules/accounts/application/ensure-account";
import { recordAuditEvent, type AuditRepository } from "@/modules/audit";
import { deriveAccountCapabilities } from "@/modules/billing";
import { checkDuplicateIdentifiers } from "./check-duplicate-identifiers";
import type { ItemRepository } from "./item-repository";
import type { ItemRecord, UpdateItemResult } from "./types";
import { validateItemIdentifiers } from "./validate-item-identifiers";

type UpdateItemInput = {
  account: AccountRecord;
  actorId: string;
  itemId: string;
  input: {
    nomenclature?: string;
    ecn?: string | null;
    serialNumber?: string | null;
    notes?: string | null;
    confirmDuplicate?: boolean;
  };
  itemRepository: ItemRepository;
  auditRepository: AuditRepository;
  now?: Date;
};

function cleanOptionalText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function changedFields(
  current: ItemRecord,
  next: Pick<ItemRecord, "nomenclature" | "ecn" | "serialNumber" | "notes">,
) {
  const fields = ["nomenclature", "ecn", "serialNumber", "notes"] as const;

  return fields.filter((field) => current[field] !== next[field]);
}

export async function updateItem({
  account,
  actorId,
  itemId,
  input,
  itemRepository,
  auditRepository,
  now = new Date(),
}: UpdateItemInput): Promise<UpdateItemResult> {
  const capabilities = deriveAccountCapabilities(account, now);

  if (capabilities.isReadOnly) {
    throw new Error("This account is read-only.");
  }

  const existing = await itemRepository.findById(account.id, itemId);

  if (!existing) {
    return { item: null };
  }

  const nomenclature =
    input.nomenclature === undefined
      ? existing.nomenclature
      : input.nomenclature.trim();

  if (!nomenclature) {
    throw new Error("Item nomenclature is required.");
  }

  const next = {
    nomenclature,
    ecn: input.ecn === undefined ? existing.ecn : cleanOptionalText(input.ecn),
    serialNumber:
      input.serialNumber === undefined
        ? existing.serialNumber
        : cleanOptionalText(input.serialNumber),
    notes:
      input.notes === undefined
        ? existing.notes
        : cleanOptionalText(input.notes),
  };
  const identifierValidation = validateItemIdentifiers({
    ...next,
    generatedId: existing.generatedId,
  });

  if (!identifierValidation.ok) {
    throw new Error(identifierValidation.message);
  }

  const changedFieldNames = changedFields(existing, next);

  if (changedFieldNames.length === 0) {
    return { item: existing };
  }

  const identifiersChanged =
    existing.ecn !== next.ecn || existing.serialNumber !== next.serialNumber;

  if (identifiersChanged) {
    const duplicateWarning = await checkDuplicateIdentifiers({
      accountId: account.id,
      ecn: next.ecn,
      serialNumber: next.serialNumber,
      excludeItemId: itemId,
      repository: itemRepository,
    });

    if (duplicateWarning.hasDuplicate && !input.confirmDuplicate) {
      return { duplicateWarning };
    }
  }

  const updated = await itemRepository.update(account.id, itemId, {
    ...next,
    updatedAt: now,
  });

  if (!updated) {
    return { item: null };
  }

  await recordAuditEvent({
    accountId: account.id,
    actorId,
    action: "item.updated",
    target: {
      type: "item",
      id: itemId,
    },
    metadata: {
      changedFields: changedFieldNames,
      name: updated.nomenclature,
      handReceiptId: updated.handReceiptId,
    },
    occurredAt: now,
    repository: auditRepository,
  });

  return { item: updated };
}
