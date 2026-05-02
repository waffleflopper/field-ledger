import type { AccountRecord } from "@/modules/accounts/application/ensure-account";
import { recordAuditEvent, type AuditRepository } from "@/modules/audit";
import {
  canCreateRequirement,
  deriveAccountCapabilities,
} from "@/modules/billing";
import type { ItemRepository } from "@/modules/items";
import { calculateNextDueDate, toLocalDateOnly } from "./date-only";
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
    confirmDuplicate?: boolean;
  };
  itemRepository: Pick<ItemRepository, "findById">;
  requirementRepository: RequirementRepository;
  auditRepository: AuditRepository;
  now?: Date;
  createRequirementId?: () => string;
};

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
  const createdOn = toLocalDateOnly(now);
  const nextDueDate = calculateNextDueDate(createdOn, {
    intervalType: input.intervalType,
    intervalValue,
  });
  const requirement = await requirementRepository.create({
    id: requirementId,
    accountId: account.id,
    itemId: input.itemId,
    name,
    notes,
    intervalType: input.intervalType,
    intervalValue,
    nextDueDate,
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
      createdOn,
      nextDueDate,
    },
    occurredAt: now,
    repository: auditRepository,
  });

  return { requirement };
}
