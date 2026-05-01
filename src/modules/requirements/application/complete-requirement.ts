import type { AccountRecord } from "@/modules/accounts/application/ensure-account";
import { recordAuditEvent, type AuditRepository } from "@/modules/audit";
import {
  deriveAccountCapabilities,
  isAccountReadOnly,
} from "@/modules/billing";
import {
  calculateNextDueDate,
  isValidDateOnly,
  toLocalDateOnly,
} from "./date-only";
import type { RequirementCompletionRepository } from "./requirement-completion-repository";
import type { RequirementRepository } from "./requirement-repository";

type CompleteRequirementInput = {
  account: AccountRecord;
  actorId: string;
  input: {
    requirementId: string;
    completedOn?: string;
    notes?: string | null;
  };
  requirementRepository: RequirementRepository;
  completionRepository: RequirementCompletionRepository;
  auditRepository: AuditRepository;
  now?: Date;
  createCompletionId?: () => string;
};

export async function completeRequirement({
  account,
  actorId,
  input,
  requirementRepository,
  completionRepository,
  auditRepository,
  now = new Date(),
  createCompletionId = () => globalThis.crypto.randomUUID(),
}: CompleteRequirementInput) {
  const capabilities = deriveAccountCapabilities(account, now);

  if (isAccountReadOnly(capabilities)) {
    throw new Error("This account is read-only.");
  }

  const today = toLocalDateOnly(now);
  const completedOn = input.completedOn ?? today;

  if (!isValidDateOnly(completedOn)) {
    throw new Error("Completion date must use YYYY-MM-DD format.");
  }

  if (completedOn > today) {
    throw new Error("Completion date cannot be in the future.");
  }

  const requirement = await requirementRepository.findById(
    account.id,
    input.requirementId,
  );

  if (!requirement) {
    return null;
  }

  const nextDueDate = calculateNextDueDate(completedOn, {
    intervalType: requirement.intervalType,
    intervalValue: requirement.intervalValue,
  });
  const trimmedNotes = input.notes?.trim() || null;
  const completion = await completionRepository.create({
    id: createCompletionId(),
    accountId: account.id,
    requirementId: requirement.id,
    completedOn,
    notes: trimmedNotes,
    createdAt: now,
  });
  const updatedRequirement = await requirementRepository.updateNextDueDate(
    account.id,
    requirement.id,
    {
      nextDueDate,
      updatedAt: now,
    },
  );

  if (!updatedRequirement) {
    throw new Error("Requirement was not found.");
  }

  await recordAuditEvent({
    accountId: account.id,
    actorId,
    action: "requirement.completed",
    target: {
      type: "requirement",
      id: requirement.id,
    },
    metadata: {
      itemId: requirement.itemId,
      name: requirement.name,
      requirementName: requirement.name,
      completedOn,
      nextDueDate,
    },
    occurredAt: now,
    repository: auditRepository,
  });

  return {
    completion,
    requirement: updatedRequirement,
  };
}
