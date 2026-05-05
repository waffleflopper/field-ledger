import type { AccountRecord } from "@/modules/accounts/application/ensure-account";
import { recordAuditEvent, type AuditRepository } from "@/modules/audit";
import { deriveAccountCapabilities } from "@/modules/billing";
import type { ContactRepository } from "./contact-repository";

type ArchiveContactInput = {
  account: AccountRecord;
  actorId: string;
  contactId: string;
  contactRepository: ContactRepository;
  auditRepository: AuditRepository;
  now?: Date;
};

export async function archiveContact({
  account,
  actorId,
  contactId,
  contactRepository,
  auditRepository,
  now = new Date(),
}: ArchiveContactInput) {
  const capabilities = deriveAccountCapabilities(account, now);

  if (capabilities.isReadOnly) {
    throw new Error("This account is read-only.");
  }

  const existing = await contactRepository.findById(account.id, contactId);

  if (!existing) {
    return null;
  }

  if (existing.archivedAt) {
    throw new Error("Contact is already archived.");
  }

  const archived = await contactRepository.update(account.id, contactId, {
    archivedAt: now,
    updatedAt: now,
  });

  if (!archived) {
    return null;
  }

  await recordAuditEvent({
    accountId: account.id,
    actorId,
    action: "contact.archived",
    target: {
      type: "contact",
      id: contactId,
    },
    metadata: {
      displayName: existing.displayName,
    },
    occurredAt: now,
    repository: auditRepository,
  });

  return archived;
}
