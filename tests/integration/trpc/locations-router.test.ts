import { describe, expect, it, vi } from "vitest";

import type { AccountRecord } from "@/modules/accounts/application/ensure-account";
import type { AppUnitOfWork } from "@/modules/provider-boundaries/database/app-unit-of-work";
import { appRouter } from "@/server/trpc/router";
import { InMemoryAccountRepository } from "../../support/account-repository";
import { InMemoryAuditRepository } from "../../support/audit-repository";
import { createInMemoryAppUnitOfWork } from "../../support/app-unit-of-work";
import { createEmptyContactRepository } from "../../support/contact-repository";
import { createEmptyHandReceiptRepository } from "../../support/hand-receipt-repository";
import { createEmptyItemRepository } from "../../support/item-repository";
import { InMemoryLocationRepository } from "../../support/location-repository";
import { createEmptyRequirementRepository } from "../../support/requirement-repository";

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
  locationRepository = new InMemoryLocationRepository(),
  unitOfWork,
}: {
  account?: AccountRecord;
  auditRepository?: InMemoryAuditRepository;
  locationRepository?: InMemoryLocationRepository;
  unitOfWork?: AppUnitOfWork;
} = {}) {
  const accountRepository = new InMemoryAccountRepository([account]);
  const contactRepository = createEmptyContactRepository();
  const handReceiptRepository = createEmptyHandReceiptRepository();
  const itemRepository = createEmptyItemRepository();
  const requirementRepository = createEmptyRequirementRepository();

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
    requirementRepository,
    unitOfWork:
      unitOfWork ??
      createInMemoryAppUnitOfWork({
        accountRepository,
        auditRepository,
        contactRepository,
        handReceiptRepository,
        itemRepository,
        locationRepository,
        requirementRepository,
      }),
  });
}

describe("locationsRouter", () => {
  it("creates, lists, and searches account locations through tRPC", async () => {
    const locationRepository = new InMemoryLocationRepository();
    const auditRepository = new InMemoryAuditRepository();
    const caller = createCaller({ auditRepository, locationRepository });

    const location = await caller.locations.create({
      name: "Arms room",
    });

    expect(location).toMatchObject({
      accountId: "account-1",
      name: "Arms room",
    });
    await expect(caller.locations.list()).resolves.toMatchObject([
      {
        name: "Arms room",
      },
    ]);
    await expect(
      caller.locations.search({ query: "arms" }),
    ).resolves.toMatchObject([
      {
        name: "Arms room",
      },
    ]);
    expect(auditRepository.events).toMatchObject([
      {
        action: "location.created",
      },
    ]);
  });

  it("maps read-only location creation to FORBIDDEN while keeping reads available", async () => {
    const locationRepository = new InMemoryLocationRepository([
      {
        id: "location-1",
        accountId: "account-1",
        name: "Arms room",
        createdAt: new Date("2026-05-01T12:00:00.000Z"),
        updatedAt: new Date("2026-05-01T12:00:00.000Z"),
      },
    ]);
    const caller = createCaller({
      account: createAccount({
        accessState: "paused_read_only",
        subscriptionTier: "pro",
      }),
      locationRepository,
    });

    await expect(caller.locations.list()).resolves.toMatchObject([
      {
        name: "Arms room",
      },
    ]);
    await expect(
      caller.locations.create({
        name: "Motor pool",
      }),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "This account is read-only.",
    });
  });

  it("logs unexpected location creation failures without exposing backend messages", async () => {
    const backendError = new Error("storage adapter secret leaked");
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
        caller.locations.create({
          name: "Motor pool",
        }),
      ).rejects.toMatchObject({
        code: "INTERNAL_SERVER_ERROR",
        message: "Unable to create location.",
      });
      expect(errorSpy).toHaveBeenCalledWith(
        "Unexpected locations tRPC error.",
        expect.objectContaining({
          accountId: "account-1",
          operation: "locations.create",
          userId: "owner-1",
          error: backendError,
        }),
      );
    } finally {
      errorSpy.mockRestore();
    }
  });
});
