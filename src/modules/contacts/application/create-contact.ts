import type { AccountRecord } from "@/modules/accounts/application/ensure-account";
import { recordAuditEvent, type AuditRepository } from "@/modules/audit";
import { deriveAccountCapabilities } from "@/modules/billing";
import type { ContactRepository } from "./contact-repository";
import type { ContactRecord } from "./types";

type CreateContactInput = {
  account: AccountRecord;
  actorId: string;
  input: {
    displayName: string;
  };
  contactRepository: ContactRepository;
  auditRepository: AuditRepository;
  now?: Date;
  createContactId?: () => string;
};

export async function createContact({
  account,
  actorId,
  input,
  contactRepository,
  auditRepository,
  now = new Date(),
  createContactId = () => globalThis.crypto.randomUUID(),
}: CreateContactInput): Promise<ContactRecord> {
  const capabilities = deriveAccountCapabilities(account, now);

  if (capabilities.isReadOnly) {
    throw new Error("This account is read-only.");
  }

  const displayName = input.displayName.trim();

  if (!displayName) {
    throw new Error("Contact display name is required.");
  }

  const contact = await contactRepository.create({
    id: createContactId(),
    accountId: account.id,
    displayName,
    createdAt: now,
    updatedAt: now,
  });

  await recordAuditEvent({
    accountId: account.id,
    actorId,
    action: "contact.created",
    target: {
      type: "contact",
      id: contact.id,
    },
    metadata: {
      displayName,
    },
    occurredAt: now,
    repository: auditRepository,
  });

  return contact;
}
