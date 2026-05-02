import type { AccountRecord } from "@/modules/accounts/application/ensure-account";
import { recordAuditEvent, type AuditRepository } from "@/modules/audit";
import {
  canEditRequirement,
  deriveAccountCapabilities,
} from "@/modules/billing";
import { calculateNextDueDate, toDateOnly } from "./date-only";
import type { RequirementCompletionRepository } from "./requirement-completion-repository";
import type { RequirementRepository } from "./requirement-repository";
import {
  isPresetRequirementIntervalType,
  isRequirementIntervalType,
  type RequirementIntervalType,
  type UpdateRequirementResult,
} from "./types";

type UpdateRequirementInput = {
  account: AccountRecord;
  actorId: string;
  input: {
    requirementId: string;
    name: string;
    notes?: string | null;
    intervalType: string;
    intervalValue?: number | null;
  };
  requirementRepository: RequirementRepository;
  completionRepository: RequirementCompletionRepository;
  auditRepository: AuditRepository;
  now?: Date;
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

function intervalChanged({
  previous,
  next,
}: {
  previous: {
    intervalType: RequirementIntervalType;
    intervalValue: number | null;
  };
  next: {
    intervalType: RequirementIntervalType;
    intervalValue: number | null;
  };
}) {
  return (
    previous.intervalType !== next.intervalType ||
    previous.intervalValue !== next.intervalValue
  );
}

export async function updateRequirement({
  account,
  actorId,
  input,
  requirementRepository,
  completionRepository,
  auditRepository,
  now = new Date(),
}: UpdateRequirementInput): Promise<UpdateRequirementResult> {
  const capabilities = deriveAccountCapabilities(account, now);

  if (!canEditRequirement(capabilities)) {
    throw new Error("This account is read-only.");
  }

  const name = input.name.trim();

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
  const notes = input.notes?.trim() || null;
  const existing = await requirementRepository.findById(
    account.id,
    input.requirementId,
  );

  if (!existing) {
    throw new Error("Requirement was not found.");
  }

  const didIntervalChange = intervalChanged({
    previous: {
      intervalType: existing.intervalType,
      intervalValue: existing.intervalValue,
    },
    next: {
      intervalType: input.intervalType,
      intervalValue,
    },
  });
  let nextDueDate = existing.nextDueDate;

  if (didIntervalChange) {
    const latestCompletion =
      await completionRepository.findLatestByRequirementId(
        account.id,
        existing.id,
      );
    const baseDate =
      latestCompletion?.completedOn ?? toDateOnly(existing.createdAt);

    nextDueDate = calculateNextDueDate(baseDate, {
      intervalType: input.intervalType,
      intervalValue,
    });
  }

  const duplicateWarning = (
    await requirementRepository.findByItemId(account.id, existing.itemId)
  ).some(
    (requirement) =>
      requirement.id !== existing.id &&
      requirement.name.trim().toLowerCase() === name.toLowerCase(),
  );
  const changedFields: string[] = [];

  if (existing.name !== name) {
    changedFields.push("name");
  }

  if (existing.notes !== notes) {
    changedFields.push("notes");
  }

  if (existing.intervalType !== input.intervalType) {
    changedFields.push("intervalType");
  }

  if (existing.intervalValue !== intervalValue) {
    changedFields.push("intervalValue");
  }

  if (existing.nextDueDate !== nextDueDate) {
    changedFields.push("nextDueDate");
  }

  if (changedFields.length === 0) {
    return {
      requirement: existing,
      duplicateWarning,
    };
  }

  const updated = await requirementRepository.update(account.id, existing.id, {
    name,
    notes,
    intervalType: input.intervalType,
    intervalValue,
    nextDueDate,
    updatedAt: now,
  });

  if (!updated) {
    throw new Error("Requirement was not found.");
  }

  await recordAuditEvent({
    accountId: account.id,
    actorId,
    action: "requirement.updated",
    target: {
      type: "requirement",
      id: existing.id,
    },
    metadata: {
      itemId: existing.itemId,
      name,
      requirementName: name,
      changedFields,
      previousInterval: {
        intervalType: existing.intervalType,
        intervalValue: existing.intervalValue,
      },
      newInterval: {
        intervalType: updated.intervalType,
        intervalValue: updated.intervalValue,
      },
      nextDueDate,
      duplicateWarning,
    },
    occurredAt: now,
    repository: auditRepository,
  });

  return {
    requirement: updated,
    duplicateWarning,
  };
}
