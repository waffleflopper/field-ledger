import { describe, expect, it } from "vitest";

import type { AccountRecord } from "@/modules/accounts/application/ensure-account";
import { createContact, searchContacts } from "@/modules/contacts";
import { InMemoryAuditRepository } from "../../support/audit-repository";
import { InMemoryContactRepository } from "../../support/contact-repository";

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

describe("contacts", () => {
  it("creates an account-owned contact and records audit history", async () => {
    const account = createAccount();
    const contactRepository = new InMemoryContactRepository();
    const auditRepository = new InMemoryAuditRepository();

    const contact = await createContact({
      account,
      actorId: account.userId,
      input: {
        displayName: "SSG Rivera",
      },
      contactRepository,
      auditRepository,
      now: new Date("2026-05-01T12:00:00.000Z"),
      createContactId: () => "contact-1",
    });

    expect(contact).toMatchObject({
      id: "contact-1",
      accountId: account.id,
      displayName: "SSG Rivera",
    });
    expect(auditRepository.events).toMatchObject([
      {
        action: "contact.created",
        targetType: "contact",
        targetId: "contact-1",
        metadata: {
          displayName: "SSG Rivera",
        },
      },
    ]);
  });

  it("blocks contact creation for read-only accounts", async () => {
    await expect(
      createContact({
        account: createAccount({
          accessState: "paused_read_only",
          subscriptionTier: "pro",
        }),
        actorId: "owner-1",
        input: {
          displayName: "SSG Rivera",
        },
        contactRepository: new InMemoryContactRepository(),
        auditRepository: new InMemoryAuditRepository(),
      }),
    ).rejects.toThrow("This account is read-only.");
  });

  it("suggests account contacts by case-insensitive prefix", async () => {
    const repository = new InMemoryContactRepository([
      {
        id: "contact-1",
        accountId: "account-1",
        displayName: "SSG Rivera",
        createdAt: new Date("2026-05-01T12:00:00.000Z"),
        updatedAt: new Date("2026-05-01T12:00:00.000Z"),
      },
      {
        id: "contact-2",
        accountId: "account-1",
        displayName: "CPL Rivers",
        createdAt: new Date("2026-05-01T12:00:00.000Z"),
        updatedAt: new Date("2026-05-01T12:00:00.000Z"),
      },
      {
        id: "contact-3",
        accountId: "account-2",
        displayName: "SSG Rivera",
        createdAt: new Date("2026-05-01T12:00:00.000Z"),
        updatedAt: new Date("2026-05-01T12:00:00.000Z"),
      },
    ]);

    await expect(
      searchContacts({
        accountId: "account-1",
        query: "ssg",
        repository,
      }),
    ).resolves.toMatchObject([
      {
        id: "contact-1",
        displayName: "SSG Rivera",
      },
    ]);
  });

  it("returns no contact suggestions for blank searches", async () => {
    const repository = new InMemoryContactRepository([
      {
        id: "contact-1",
        accountId: "account-1",
        displayName: "SSG Rivera",
        createdAt: new Date("2026-05-01T12:00:00.000Z"),
        updatedAt: new Date("2026-05-01T12:00:00.000Z"),
      },
    ]);

    await expect(
      searchContacts({
        accountId: "account-1",
        query: "   ",
        repository,
      }),
    ).resolves.toEqual([]);
  });
});
