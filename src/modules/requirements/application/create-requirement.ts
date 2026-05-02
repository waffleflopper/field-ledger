import type { AccountRecord } from "@/modules/accounts/application/ensure-account";
import { recordAuditEvent, type AuditRepository } from "@/modules/audit";
import {
  canCreateRequirement,
  deriveAccountCapabilities,
} from "@/modules/billing";
import type { ItemRepository } from "@/modules/items";
import type { RequirementRepository } from "./requirement-repository";
import {
  isPresetRequirementIntervalType,
  isRequirementIntervalType,
  type CreateRequirementResult,
  type RequirementIntervalType,
} from "./types";

type CreateRequirementInput = {
  account: AccountRecord;
  actorId: string;
  input: {
    itemId: string;
    name: string;
    notes?: string | null;
    intervalType: string;
    intervalValue?: number | null;
    nextDueDate: string;
    confirmDuplicate?: boolean;
  };
  itemRepository: Pick<ItemRepository, "findById">;
  requirementRepository: RequirementRepository;
  auditRepository: AuditRepository;
  now?: Date;
  createRequirementId?: () => string;
};

const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateOnly(value: string) {
  if (!dateOnlyPattern.test(value)) {
    return false;
  }

  const parts = value.split("-").map(Number);
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];

  if (year === undefined || month === undefined || day === undefined) {
    return false;
  }

  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function validateIntervalValue(
  intervalType: RequirementIntervalType,
  intervalValue: number | null | undefined,
): number | null {
  if (isPresetRequirementIntervalType(intervalType)) {
    if (intervalValue !== null && intervalValue !== undefined) {
      throw new Error("Preset requirement intervals cannot include a value.");
    }

    return null;
  }

  if (!Number.isInteger(intervalValue) || (intervalValue ?? 0) < 1) {
    throw new Error(
      "Custom requirement intervals need a positive whole number.",
    );
  }

  return intervalValue as number;
}

export async function createRequirement({
  account,
  actorId,
  input,
  itemRepository,
  requirementRepository,
  auditRepository,
  now = new Date(),
  createRequirementId = () => globalThis.crypto.randomUUID(),
}: CreateRequirementInput): Promise<CreateRequirementResult> {
  const name = input.name.trim();
  const notes = input.notes?.trim() || null;

  if (!name) {
    throw new Error("Requirement name is required.");
  }

  if (!isRequirementIntervalType(input.intervalType)) {
    throw new Error("Requirement interval is not supported.");
  }

  const intervalValue = validateIntervalValue(
    input.intervalType,
    input.intervalValue,
  );

  if (!isValidDateOnly(input.nextDueDate)) {
    throw new Error("Next due date must use YYYY-MM-DD format.");
  }

  const capabilities = deriveAccountCapabilities(account, now);

  if (!canCreateRequirement(capabilities)) {
    throw new Error("This account is read-only.");
  }

  const item = await itemRepository.findById(account.id, input.itemId);

  if (!item) {
    throw new Error("Item was not found.");
  }

  if (item.status !== "active") {
    throw new Error("Item is not active.");
  }

  const duplicate = await requirementRepository.findByName(
    account.id,
    input.itemId,
    name,
  );

  if (duplicate && !input.confirmDuplicate) {
    return {
      duplicateWarning: {
        hasDuplicate: true,
        existingRequirement: duplicate,
      },
    };
  }

  const requirementId = createRequirementId();
  const requirement = await requirementRepository.create({
    id: requirementId,
    accountId: account.id,
    itemId: input.itemId,
    name,
    notes,
    intervalType: input.intervalType,
    intervalValue,
    nextDueDate: input.nextDueDate,
    status: "active",
    createdAt: now,
    updatedAt: now,
  });

  await recordAuditEvent({
    accountId: account.id,
    actorId,
    action: "requirement.created",
    target: {
      type: "requirement",
      id: requirementId,
    },
    metadata: {
      itemId: input.itemId,
      name,
      notes,
      intervalType: input.intervalType,
      intervalValue,
      nextDueDate: input.nextDueDate,
    },
    occurredAt: now,
    repository: auditRepository,
  });

  return { requirement };
}
