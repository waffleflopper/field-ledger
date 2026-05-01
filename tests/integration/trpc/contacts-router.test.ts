import { describe, expect, it, vi } from "vitest";

import type { AccountRecord } from "@/modules/accounts/application/ensure-account";
import type { AppUnitOfWork } from "@/modules/provider-boundaries/database/app-unit-of-work";
import { appRouter } from "@/server/trpc/router";
import { InMemoryAccountRepository } from "../../support/account-repository";
import { InMemoryAuditRepository } from "../../support/audit-repository";
import { createInMemoryAppUnitOfWork } from "../../support/app-unit-of-work";
import { InMemoryContactRepository } from "../../support/contact-repository";
import { createEmptyHandReceiptRepository } from "../../support/hand-receipt-repository";
import { createEmptyItemRepository } from "../../support/item-repository";
import { createEmptyLocationRepository } from "../../support/location-repository";

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

function createCaller({
  account = createAccount(),
  auditRepository = new InMemoryAuditRepository(),
  contactRepository = new InMemoryContactRepository(),
  unitOfWork,
}: {
  account?: AccountRecord;
  auditRepository?: InMemoryAuditRepository;
  contactRepository?: InMemoryContactRepository;
  unitOfWork?: AppUnitOfWork;
} = {}) {
  const accountRepository = new InMemoryAccountRepository([account]);
  const handReceiptRepository = createEmptyHandReceiptRepository();
  const itemRepository = createEmptyItemRepository();
  const locationRepository = createEmptyLocationRepository();

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
    locationRepository,
    unitOfWork:
      unitOfWork ??
      createInMemoryAppUnitOfWork({
        accountRepository,
        auditRepository,
        contactRepository,
        handReceiptRepository,
        itemRepository,
        locationRepository,
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

  it("logs unexpected contact creation failures without exposing backend messages", async () => {
    const backendError = new Error("database connection string leaked");
    const errorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const caller = createCaller({
      unitOfWork: {
        async run() {
          throw backendError;
        },
      },
    });

    try {
      await expect(
        caller.contacts.create({
          displayName: "CPL Nguyen",
        }),
      ).rejects.toMatchObject({
        code: "INTERNAL_SERVER_ERROR",
        message: "Unable to update contacts.",
      });
      expect(errorSpy).toHaveBeenCalledWith(
        "Unexpected contacts tRPC error.",
        expect.objectContaining({
          accountId: "account-1",
          operation: "contacts.create",
          userId: "owner-1",
          error: backendError,
        }),
      );
    } finally {
      errorSpy.mockRestore();
    }
  });
});
