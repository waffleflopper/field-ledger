import type { AccountRecord } from "@/modules/accounts/application/ensure-account";
import { recordAuditEvent, type AuditRepository } from "@/modules/audit";
import { deriveAccountCapabilities } from "@/modules/billing";
import type { ContactRepository } from "./contact-repository";

type UpdateContactInput = {
  account: AccountRecord;
  actorId: string;
  contactId: string;
  input: {
    displayName: string;
  };
  contactRepository: ContactRepository;
  auditRepository: AuditRepository;
  now?: Date;
};

export async function updateContact({
  account,
  actorId,
  contactId,
  input,
  contactRepository,
  auditRepository,
  now = new Date(),
}: UpdateContactInput) {
  const capabilities = deriveAccountCapabilities(account, now);

  if (capabilities.isReadOnly) {
    throw new Error("This account is read-only.");
  }

  const existing = await contactRepository.findById(account.id, contactId);

  if (!existing || existing.archivedAt) {
    return null;
  }

  const displayName = input.displayName.trim();

  if (!displayName) {
    throw new Error("Contact display name is required.");
  }

  if (displayName === existing.displayName) {
    return existing;
  }

  const updated = await contactRepository.update(account.id, contactId, {
    displayName,
    updatedAt: now,
  });

  if (!updated) {
    return null;
  }

  await recordAuditEvent({
    accountId: account.id,
    actorId,
    action: "contact.updated",
    target: {
      type: "contact",
      id: contactId,
    },
    metadata: {
      displayName,
      previousDisplayName: existing.displayName,
    },
    occurredAt: now,
    repository: auditRepository,
  });

  return updated;
}
