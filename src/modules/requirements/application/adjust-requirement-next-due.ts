import type { AccountRecord } from "@/modules/accounts/application/ensure-account";
import { recordAuditEvent, type AuditRepository } from "@/modules/audit";
import {
  canEditRequirement,
  deriveAccountCapabilities,
} from "@/modules/billing";
import { isValidDateOnly } from "./date-only";
import type { RequirementRepository } from "./requirement-repository";

type AdjustRequirementNextDueInput = {
  account: AccountRecord;
  actorId: string;
  input: {
    requirementId: string;
    nextDueDate: string;
  };
  requirementRepository: RequirementRepository;
  auditRepository: AuditRepository;
  now?: Date;
};

export async function adjustRequirementNextDue({
  account,
  actorId,
  input,
  requirementRepository,
  auditRepository,
  now = new Date(),
}: AdjustRequirementNextDueInput) {
  const capabilities = deriveAccountCapabilities(account, now);

  if (!canEditRequirement(capabilities)) {
    throw new Error("This account is read-only.");
  }

  if (!isValidDateOnly(input.nextDueDate)) {
    throw new Error("Next due date must use YYYY-MM-DD format.");
  }

  const existing = await requirementRepository.findById(
    account.id,
    input.requirementId,
  );

  if (!existing) {
    throw new Error("Requirement was not found.");
  }

  if (existing.pausedAt) {
    throw new Error("Requirement is paused.");
  }

  if (existing.nextDueDate === input.nextDueDate) {
    return existing;
  }

  const updated = await requirementRepository.updateLifecycle(
    account.id,
    existing.id,
    {
      nextDueDate: input.nextDueDate,
      updatedAt: now,
    },
  );

  if (!updated) {
    throw new Error("Requirement was not found.");
  }

  await recordAuditEvent({
    accountId: account.id,
    actorId,
    action: "requirement.next_due_adjusted",
    target: {
      type: "requirement",
      id: existing.id,
    },
    metadata: {
      itemId: existing.itemId,
      name: existing.name,
      requirementName: existing.name,
      previousNextDueDate: existing.nextDueDate,
      nextDueDate: updated.nextDueDate,
    },
    occurredAt: now,
    repository: auditRepository,
  });

  return updated;
}
