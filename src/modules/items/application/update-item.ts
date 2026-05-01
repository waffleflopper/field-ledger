import type { AccountRecord } from "@/modules/accounts/application/ensure-account";
import { recordAuditEvent, type AuditRepository } from "@/modules/audit";
import { deriveAccountCapabilities } from "@/modules/billing";
import type { LocationRepository } from "@/modules/locations";
import { checkDuplicateIdentifiers } from "./check-duplicate-identifiers";
import type { ItemRepository } from "./item-repository";
import type { ItemRecord, UpdateItemResult } from "./types";
import { validateItemIdentifiers } from "./validate-item-identifiers";

const editableItemFields = [
  "nomenclature",
  "ecn",
  "serialNumber",
  "notes",
  "locationId",
] as const;

type EditableItemField = (typeof editableItemFields)[number];
type EditableItemValues = Pick<ItemRecord, EditableItemField>;

type UpdateItemInput = {
  account: AccountRecord;
  actorId: string;
  itemId: string;
  input: {
    nomenclature?: string;
    ecn?: string | null;
    serialNumber?: string | null;
    notes?: string | null;
    locationId?: string | null;
    confirmDuplicate?: boolean;
  };
  itemRepository: ItemRepository;
  locationRepository: LocationRepository;
  auditRepository: AuditRepository;
  now?: Date;
};

function normalizeOptionalText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function nextEditableItemValues(
  current: ItemRecord,
  input: UpdateItemInput["input"],
): EditableItemValues {
  return {
    nomenclature:
      input.nomenclature === undefined
        ? current.nomenclature
        : input.nomenclature.trim(),
    ecn:
      input.ecn === undefined ? current.ecn : normalizeOptionalText(input.ecn),
    serialNumber:
      input.serialNumber === undefined
        ? current.serialNumber
        : normalizeOptionalText(input.serialNumber),
    notes:
      input.notes === undefined
        ? current.notes
        : normalizeOptionalText(input.notes),
    locationId:
      input.locationId === undefined
        ? (current.locationId ?? null)
        : input.locationId,
  };
}

function currentEditableItemValues(current: ItemRecord): EditableItemValues {
  return {
    nomenclature: current.nomenclature,
    ecn: current.ecn,
    serialNumber: current.serialNumber,
    notes: current.notes,
    locationId: current.locationId ?? null,
  };
}

function changedFields(current: ItemRecord, next: EditableItemValues) {
  const currentValues = currentEditableItemValues(current);

  return editableItemFields.filter(
    (field) => currentValues[field] !== next[field],
  );
}

function identifiersChanged(current: ItemRecord, next: EditableItemValues) {
  return current.ecn !== next.ecn || current.serialNumber !== next.serialNumber;
}

export async function updateItem({
  account,
  actorId,
  itemId,
  input,
  itemRepository,
  locationRepository,
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

  const next = nextEditableItemValues(existing, input);

  if (!next.nomenclature) {
    throw new Error("Item nomenclature is required.");
  }

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

  if (next.locationId) {
    const location = await locationRepository.findById(
      account.id,
      next.locationId,
    );

    if (!location) {
      throw new Error("Location was not found.");
    }
  }

  if (identifiersChanged(existing, next)) {
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

  if ((existing.locationId ?? null) !== (updated.locationId ?? null)) {
    await recordAuditEvent({
      accountId: account.id,
      actorId,
      action: "item.location_changed",
      target: {
        type: "item",
        id: itemId,
      },
      metadata: {
        name: updated.nomenclature,
        previousLocationId: existing.locationId ?? null,
        previousLocationName: existing.locationName ?? null,
        newLocationId: updated.locationId ?? null,
        newLocationName: updated.locationName ?? null,
      },
      occurredAt: now,
      repository: auditRepository,
    });
  }

  return { item: updated };
}
