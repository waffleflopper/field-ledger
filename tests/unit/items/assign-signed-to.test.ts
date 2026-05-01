import { describe, expect, it } from "vitest";

import type { AccountRecord } from "@/modules/accounts/application/ensure-account";
import {
  assignSignedTo,
  assignSignedToWithNewContact,
  clearSignedTo,
} from "@/modules/items";
import { InMemoryAuditRepository } from "../../support/audit-repository";
import { InMemoryContactRepository } from "../../support/contact-repository";
import { InMemoryItemRepository } from "../../support/item-repository";

function createAccount(overrides: Partial<AccountRecord> = {}): AccountRecord {
  return {
    id: "account-1",
    userId: "owner-1",
    accessState: "active",
    subscriptionTier: "base",
    trialStartsAt: new Date("2026-04-01T12:00:00.000Z"),
    trialEndsAt: new Date("2100-01-01T00:00:00.000Z"),
    onboardingCompletedAt: null,
    ...overrides,
  };
}

function createItemRepository() {
  return new InMemoryItemRepository([
    {
      id: "item-1",
      accountId: "account-1",
      handReceiptId: "hand-receipt-1",
      nomenclature: "M4 carbine",
      ecn: "ECN-001",
      serialNumber: null,
      generatedId: null,
      notes: null,
      status: "active",
      createdAt: new Date("2026-04-30T12:00:00.000Z"),
      updatedAt: new Date("2026-04-30T12:00:00.000Z"),
    },
  ]);
}

function createContactRepository() {
  return new InMemoryContactRepository([
    {
      id: "contact-1",
      accountId: "account-1",
      displayName: "SSG Rivera",
      createdAt: new Date("2026-05-01T12:00:00.000Z"),
      updatedAt: new Date("2026-05-01T12:00:00.000Z"),
    },
    {
      id: "contact-2",
      accountId: "account-2",
      displayName: "Other account contact",
      createdAt: new Date("2026-05-01T12:00:00.000Z"),
      updatedAt: new Date("2026-05-01T12:00:00.000Z"),
    },
  ]);
}

describe("assignSignedTo", () => {
  it("assigns an item to an account contact and records no-2062 manual state", async () => {
    const account = createAccount();
    const itemRepository = createItemRepository();
    const auditRepository = new InMemoryAuditRepository();

    const item = await assignSignedTo({
      account,
      actorId: account.userId,
      itemId: "item-1",
      contactId: "contact-1",
      itemRepository,
      contactRepository: createContactRepository(),
      auditRepository,
      now: new Date("2026-05-01T12:30:00.000Z"),
    });

    expect(item).toMatchObject({
      id: "item-1",
      signedToContactId: "contact-1",
      signedToContactName: "SSG Rivera",
    });
    expect(auditRepository.events).toMatchObject([
      {
        action: "item.signed_to_assigned",
        targetType: "item",
        targetId: "item-1",
        metadata: {
          contactId: "contact-1",
          contactName: "SSG Rivera",
        },
      },
    ]);
  });

  it("creates a contact inline when assigning a new signed-to name", async () => {
    const account = createAccount();
    const contactRepository = new InMemoryContactRepository();
    const auditRepository = new InMemoryAuditRepository();

    const item = await assignSignedToWithNewContact({
      account,
      actorId: account.userId,
      itemId: "item-1",
      contactDisplayName: "CPL Nguyen",
      itemRepository: createItemRepository(),
      contactRepository,
      auditRepository,
      createContactId: () => "contact-new",
    });

    expect(contactRepository.contacts).toMatchObject([
      {
        id: "contact-new",
        displayName: "CPL Nguyen",
      },
    ]);
    expect(item).toMatchObject({
      signedToContactId: "contact-new",
      signedToContactName: "CPL Nguyen",
    });
    expect(auditRepository.events.map((event) => event.action)).toEqual([
      "contact.created",
      "item.signed_to_assigned",
    ]);
  });

  it("does not rewrite or audit when assigning the same contact", async () => {
    const account = createAccount();
    const itemRepository = new InMemoryItemRepository([
      {
        ...createItemRepository().items[0]!,
        signedToContactId: "contact-1",
        signedToContactName: "SSG Rivera",
      },
    ]);
    const auditRepository = new InMemoryAuditRepository();

    const item = await assignSignedTo({
      account,
      actorId: account.userId,
      itemId: "item-1",
      contactId: "contact-1",
      itemRepository,
      contactRepository: createContactRepository(),
      auditRepository,
      now: new Date("2026-05-01T12:30:00.000Z"),
    });

    expect(item).toMatchObject({
      id: "item-1",
      signedToContactId: "contact-1",
      signedToContactName: "SSG Rivera",
      updatedAt: new Date("2026-04-30T12:00:00.000Z"),
    });
    expect(auditRepository.events).toEqual([]);
  });

  it("clears signed-to state and records the change", async () => {
    const account = createAccount();
    const itemRepository = new InMemoryItemRepository([
      {
        id: "item-1",
        accountId: "account-1",
        handReceiptId: "hand-receipt-1",
        nomenclature: "M4 carbine",
        ecn: "ECN-001",
        serialNumber: null,
        generatedId: null,
        notes: null,
        status: "active",
        signedToContactId: "contact-1",
        signedToContactName: "SSG Rivera",
        createdAt: new Date("2026-04-30T12:00:00.000Z"),
        updatedAt: new Date("2026-04-30T12:00:00.000Z"),
      },
    ]);
    const auditRepository = new InMemoryAuditRepository();

    const item = await clearSignedTo({
      account,
      actorId: account.userId,
      itemId: "item-1",
      itemRepository,
      auditRepository,
    });

    expect(item).toMatchObject({
      signedToContactId: null,
      signedToContactName: null,
    });
    expect(auditRepository.events).toMatchObject([
      {
        action: "item.signed_to_cleared",
        metadata: {
          previousContactId: "contact-1",
          previousContactName: "SSG Rivera",
        },
      },
    ]);
  });

  it("rejects cross-account contacts and read-only accounts", async () => {
    await expect(
      assignSignedTo({
        account: createAccount(),
        actorId: "owner-1",
        itemId: "item-1",
        contactId: "contact-2",
        itemRepository: createItemRepository(),
        contactRepository: createContactRepository(),
        auditRepository: new InMemoryAuditRepository(),
      }),
    ).rejects.toThrow("Contact was not found.");

    await expect(
      assignSignedTo({
        account: createAccount({
          accessState: "paused_read_only",
          subscriptionTier: "pro",
        }),
        actorId: "owner-1",
        itemId: "item-1",
        contactId: "contact-1",
        itemRepository: createItemRepository(),
        contactRepository: createContactRepository(),
        auditRepository: new InMemoryAuditRepository(),
      }),
    ).rejects.toThrow("This account is read-only.");
  });
});
