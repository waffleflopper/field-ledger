import type { AccountRecord } from "@/modules/accounts/application/ensure-account";
import { recordAuditEvent, type AuditRepository } from "@/modules/audit";
import {
  canEditRequirement,
  deriveAccountCapabilities,
} from "@/modules/billing";
import type { HandReceiptRepository } from "@/modules/hand-receipts";
import type { ItemRepository } from "@/modules/items";
import type { RequirementRepository } from "./requirement-repository";

type ResumeRequirementInput = {
  account: AccountRecord;
  actorId: string;
  input: {
    requirementId: string;
  };
  requirementRepository: RequirementRepository;
  itemRepository: Pick<ItemRepository, "findById">;
  handReceiptRepository: Pick<HandReceiptRepository, "findById">;
  auditRepository: AuditRepository;
  now?: Date;
};

export async function resumeRequirement({
  account,
  actorId,
  input,
  requirementRepository,
  itemRepository,
  handReceiptRepository,
  auditRepository,
  now = new Date(),
}: ResumeRequirementInput) {
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

  if (!existing.pausedAt) {
    throw new Error("Requirement is not paused.");
  }

  const item = await itemRepository.findById(account.id, existing.itemId);

  if (!item || item.status !== "active") {
    throw new Error("Cannot resume requirement on archived item.");
  }

  const handReceipt = await handReceiptRepository.findById(
    account.id,
    item.handReceiptId,
  );

  if (!handReceipt || handReceipt.status !== "active") {
    throw new Error("Cannot resume requirement on archived hand receipt.");
  }

  const updated = await requirementRepository.updateLifecycle(
    account.id,
    existing.id,
    {
      pausedAt: null,
      updatedAt: now,
    },
  );

  if (!updated) {
    throw new Error("Requirement was not found.");
  }

  await recordAuditEvent({
    accountId: account.id,
    actorId,
    action: "requirement.resumed",
    target: {
      type: "requirement",
      id: existing.id,
    },
    metadata: {
      itemId: existing.itemId,
      name: existing.name,
      requirementName: existing.name,
      previousPausedAt: existing.pausedAt.toISOString(),
    },
    occurredAt: now,
    repository: auditRepository,
  });

  return updated;
}
