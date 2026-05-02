import type { AccountRecord } from "@/modules/accounts/application/ensure-account";
import { recordAuditEvent, type AuditRepository } from "@/modules/audit";
import {
  canEditRequirement,
  deriveAccountCapabilities,
} from "@/modules/billing";
import type { RequirementRepository } from "./requirement-repository";

type PauseRequirementInput = {
  account: AccountRecord;
  actorId: string;
  input: {
    requirementId: string;
  };
  requirementRepository: RequirementRepository;
  auditRepository: AuditRepository;
  now?: Date;
};

export async function pauseRequirement({
  account,
  actorId,
  input,
  requirementRepository,
  auditRepository,
  now = new Date(),
}: PauseRequirementInput) {
  const capabilities = deriveAccountCapabilities(account, now);

  if (!canEditRequirement(capabilities)) {
    throw new Error("This account is read-only.");
  }

  const existing = await requirementRepository.findById(
    account.id,
    input.requirementId,
  );

  if (!existing) {
    throw new Error("Requirement was not found.");
  }

  if (existing.pausedAt) {
    throw new Error("Requirement is already paused.");
  }

  const updated = await requirementRepository.updateLifecycle(
    account.id,
    existing.id,
    {
      pausedAt: now,
      updatedAt: now,
    },
  );

  if (!updated) {
    throw new Error("Requirement was not found.");
  }

  await recordAuditEvent({
    accountId: account.id,
    actorId,
    action: "requirement.paused",
    target: {
      type: "requirement",
      id: existing.id,
    },
    metadata: {
      itemId: existing.itemId,
      name: existing.name,
      requirementName: existing.name,
      pausedAt: now.toISOString(),
    },
    occurredAt: now,
    repository: auditRepository,
  });

  return updated;
}
