import type { AccountRecord } from "@/modules/accounts/application/ensure-account";
import { recordAuditEvent, type AuditRepository } from "@/modules/audit";
import { deriveAccountCapabilities } from "@/modules/billing";
import {
  createContact,
  type ContactRecord,
  type ContactRepository,
} from "@/modules/contacts";
import type { ItemRepository } from "./item-repository";
import type { ItemRecord } from "./types";

type AssignSignedToInput = {
  account: AccountRecord;
  actorId: string;
  itemId: string;
  contactId: string;
  contactRepository: ContactRepository;
  itemRepository: ItemRepository;
  auditRepository: AuditRepository;
  now?: Date;
};

type AssignSignedToWithNewContactInput = {
  account: AccountRecord;
  actorId: string;
  itemId: string;
  contactDisplayName: string;
  contactRepository: ContactRepository;
  itemRepository: ItemRepository;
  auditRepository: AuditRepository;
  now?: Date;
  createContactId?: () => string;
};

type ClearSignedToInput = {
  account: AccountRecord;
  actorId: string;
  itemId: string;
  itemRepository: ItemRepository;
  auditRepository: AuditRepository;
  now?: Date;
};

function assertWritable(account: AccountRecord, now: Date) {
  const capabilities = deriveAccountCapabilities(account, now);

  if (capabilities.isReadOnly) {
    throw new Error("This account is read-only.");
  }
}

async function assignItemToContact({
  accountId,
  actorId,
  item,
  contact,
  itemRepository,
  auditRepository,
  now,
}: {
  accountId: string;
  actorId: string;
  item: ItemRecord;
  contact: ContactRecord;
  itemRepository: ItemRepository;
  auditRepository: AuditRepository;
  now: Date;
}): Promise<ItemRecord | null> {
  const updated = await itemRepository.update(accountId, item.id, {
    signedToContactId: contact.id,
    updatedAt: now,
  });

  if (!updated) {
    return null;
  }

  await recordAuditEvent({
    accountId,
    actorId,
    action: "item.signed_to_assigned",
    target: {
      type: "item",
      id: item.id,
    },
    metadata: {
      name: updated.nomenclature,
      contactId: contact.id,
      contactName: contact.displayName,
    },
    occurredAt: now,
    repository: auditRepository,
  });

  return {
    ...updated,
    signedToContactId: contact.id,
    signedToContactName: contact.displayName,
  };
}

export async function assignSignedTo({
  account,
  actorId,
  itemId,
  contactId,
  contactRepository,
  itemRepository,
  auditRepository,
  now = new Date(),
}: AssignSignedToInput): Promise<ItemRecord | null> {
  assertWritable(account, now);

  const [item, contact] = await Promise.all([
    itemRepository.findById(account.id, itemId),
    contactRepository.findById(account.id, contactId),
  ]);

  if (!item) {
    return null;
  }

  if (!contact) {
    throw new Error("Contact was not found.");
  }

  return assignItemToContact({
    accountId: account.id,
    actorId,
    item,
    contact,
    itemRepository,
    auditRepository,
    now,
  });
}

export async function assignSignedToWithNewContact({
  account,
  actorId,
  itemId,
  contactDisplayName,
  contactRepository,
  itemRepository,
  auditRepository,
  now = new Date(),
  createContactId,
}: AssignSignedToWithNewContactInput): Promise<ItemRecord | null> {
  assertWritable(account, now);

  const item = await itemRepository.findById(account.id, itemId);

  if (!item) {
    return null;
  }

  const contact = await createContact({
    account,
    actorId,
    input: {
      displayName: contactDisplayName,
    },
    contactRepository,
    auditRepository,
    now,
    ...(createContactId ? { createContactId } : {}),
  });

  return assignItemToContact({
    accountId: account.id,
    actorId,
    item,
    contact,
    itemRepository,
    auditRepository,
    now,
  });
}

export async function clearSignedTo({
  account,
  actorId,
  itemId,
  itemRepository,
  auditRepository,
  now = new Date(),
}: ClearSignedToInput): Promise<ItemRecord | null> {
  assertWritable(account, now);

  const item = await itemRepository.findById(account.id, itemId);

  if (!item) {
    return null;
  }

  if (!item.signedToContactId) {
    return item;
  }

  const updated = await itemRepository.update(account.id, itemId, {
    signedToContactId: null,
    updatedAt: now,
  });

  if (!updated) {
    return null;
  }

  await recordAuditEvent({
    accountId: account.id,
    actorId,
    action: "item.signed_to_cleared",
    target: {
      type: "item",
      id: itemId,
    },
    metadata: {
      name: updated.nomenclature,
      previousContactId: item.signedToContactId,
      previousContactName: item.signedToContactName ?? null,
    },
    occurredAt: now,
    repository: auditRepository,
  });

  return {
    ...updated,
    signedToContactId: null,
    signedToContactName: null,
  };
}
