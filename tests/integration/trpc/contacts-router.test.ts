import { describe, expect, it } from "vitest";

import type { AccountRecord } from "@/modules/accounts/application/ensure-account";
import { appRouter } from "@/server/trpc/router";
import { InMemoryAccountRepository } from "../../support/account-repository";
import { InMemoryAuditRepository } from "../../support/audit-repository";
import { createInMemoryAppUnitOfWork } from "../../support/app-unit-of-work";
import { InMemoryContactRepository } from "../../support/contact-repository";
import { createEmptyHandReceiptRepository } from "../../support/hand-receipt-repository";
import { createEmptyItemRepository } from "../../support/item-repository";

function createAccount(overrides: Partial<AccountRecord> = {}): AccountRecord {
  return {
    id: "account-1",
    userId: "owner-1",
    accessState: "active",
    subscriptionTier: "base",
    trialStartsAt: new Date("2026-04-01T12:00:00.000Z"),
    trialEndsAt: new Date("2026-05-01T12:00:00.000Z"),
    onboardingCompletedAt: null,
    ...overrides,
  };
}

function createCaller({
  account = createAccount(),
  auditRepository = new InMemoryAuditRepository(),
  contactRepository = new InMemoryContactRepository(),
}: {
  account?: AccountRecord;
  auditRepository?: InMemoryAuditRepository;
  contactRepository?: InMemoryContactRepository;
} = {}) {
  const accountRepository = new InMemoryAccountRepository([account]);
  const handReceiptRepository = createEmptyHandReceiptRepository();
  const itemRepository = createEmptyItemRepository();

  return appRouter.createCaller({
    session: {
      userId: account.userId,
      email: "owner@example.com",
    },
    account,
    accountRepository,
    auditRepository,
    contactRepository,
    handReceiptRepository,
    itemRepository,
    unitOfWork: createInMemoryAppUnitOfWork({
      accountRepository,
      auditRepository,
      contactRepository,
      handReceiptRepository,
      itemRepository,
    }),
  });
}

describe("contactsRouter", () => {
  it("creates, lists, and searches account contacts through tRPC", async () => {
    const contactRepository = new InMemoryContactRepository();
    const auditRepository = new InMemoryAuditRepository();
    const caller = createCaller({ auditRepository, contactRepository });

    const contact = await caller.contacts.create({
      displayName: "SSG Rivera",
    });

    expect(contact).toMatchObject({
      accountId: "account-1",
      displayName: "SSG Rivera",
    });
    await expect(caller.contacts.list()).resolves.toMatchObject([
      {
        displayName: "SSG Rivera",
      },
    ]);
    await expect(
      caller.contacts.search({ query: "ssg" }),
    ).resolves.toMatchObject([
      {
        displayName: "SSG Rivera",
      },
    ]);
    expect(auditRepository.events).toMatchObject([
      {
        action: "contact.created",
      },
    ]);
  });

  it("maps read-only contact creation to FORBIDDEN while keeping reads available", async () => {
    const contactRepository = new InMemoryContactRepository([
      {
        id: "contact-1",
        accountId: "account-1",
        displayName: "SSG Rivera",
        createdAt: new Date("2026-05-01T12:00:00.000Z"),
        updatedAt: new Date("2026-05-01T12:00:00.000Z"),
      },
    ]);
    const caller = createCaller({
      account: createAccount({
        accessState: "paused_read_only",
        subscriptionTier: "pro",
      }),
      contactRepository,
    });

    await expect(caller.contacts.list()).resolves.toMatchObject([
      {
        displayName: "SSG Rivera",
      },
    ]);
    await expect(
      caller.contacts.create({
        displayName: "CPL Nguyen",
      }),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "This account is read-only.",
    });
  });
});
