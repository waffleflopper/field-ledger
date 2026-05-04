import { describe, expect, it } from "vitest";

import { appRouter } from "@/server/trpc/router";
import type { AccountRecord } from "@/modules/accounts/application/ensure-account";
import { InMemoryAccountRepository } from "../../support/account-repository";
import {
  createEmptyAuditRepository,
  InMemoryAuditRepository,
} from "../../support/audit-repository";
import { createInMemoryAppUnitOfWork } from "../../support/app-unit-of-work";
import { createEmptyContactRepository } from "../../support/contact-repository";
import { createEmptyHandReceiptRepository } from "../../support/hand-receipt-repository";
import { createEmptyItemRepository } from "../../support/item-repository";
import { createEmptyLocationRepository } from "../../support/location-repository";
import { createEmptyRequirementRepository } from "../../support/requirement-repository";

function createAccount(): AccountRecord {
  return {
    id: "account-1",
    userId: "user-1",
    accessState: "active",
    subscriptionTier: "base",
    trialStartsAt: new Date("2026-04-01T12:00:00.000Z"),
    trialEndsAt: new Date("2100-01-01T00:00:00.000Z"),
    onboardingCompletedAt: null,
  };
}

describe("accountsRouter", () => {
  it("serves and completes onboarding through the typed tRPC boundary", async () => {
    const account = createAccount();
    const accountRepository = new InMemoryAccountRepository([account]);
    const auditRepository = createEmptyAuditRepository();
    const caller = appRouter.createCaller({
      session: {
        userId: "user-1",
        email: "owner@example.com",
      },
      account,
      accountRepository,
      auditRepository,
      contactRepository: createEmptyContactRepository(),
      handReceiptRepository: createEmptyHandReceiptRepository(),
      itemRepository: createEmptyItemRepository(),
      locationRepository: createEmptyLocationRepository(),
      requirementRepository: createEmptyRequirementRepository(),
      unitOfWork: createInMemoryAppUnitOfWork({
        accountRepository,
        auditRepository,
      }),
    });

    await expect(caller.accounts.getOnboardingStatus()).resolves.toMatchObject({
      completed: false,
      accessState: "active",
      isReadOnly: false,
    });

    await expect(caller.accounts.completeOnboarding()).resolves.toMatchObject({
      completed: true,
      accessState: "active",
      isReadOnly: false,
    });
    expect(auditRepository.events).toMatchObject([
      {
        action: "account.onboarding_completed",
        accountId: account.id,
      },
    ]);
  });

  it("rolls back onboarding completion when audit recording fails", async () => {
    const account = createAccount();
    const accountRepository = new InMemoryAccountRepository([account]);
    const auditRepository = new InMemoryAuditRepository();
    auditRepository.failRecording = true;
    const caller = appRouter.createCaller({
      session: {
        userId: "user-1",
        email: "owner@example.com",
      },
      account,
      accountRepository,
      auditRepository,
      contactRepository: createEmptyContactRepository(),
      handReceiptRepository: createEmptyHandReceiptRepository(),
      itemRepository: createEmptyItemRepository(),
      locationRepository: createEmptyLocationRepository(),
      requirementRepository: createEmptyRequirementRepository(),
      unitOfWork: createInMemoryAppUnitOfWork({
        accountRepository,
        auditRepository,
      }),
    });

    await expect(caller.accounts.completeOnboarding()).rejects.toThrow(
      "Audit event was not recorded.",
    );

    await expect(
      accountRepository.findByUserId(account.userId),
    ).resolves.toEqual(account);
    expect(auditRepository.events).toEqual([]);
  });
});
