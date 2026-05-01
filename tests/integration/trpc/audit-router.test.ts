import { describe, expect, it } from "vitest";

import type { AccountRecord } from "@/modules/accounts/application/ensure-account";
import { appRouter } from "@/server/trpc/router";
import { createEmptyAccountRepository } from "../../support/account-repository";
import { InMemoryAuditRepository } from "../../support/audit-repository";
import { createInMemoryAppUnitOfWork } from "../../support/app-unit-of-work";
import { createEmptyHandReceiptRepository } from "../../support/hand-receipt-repository";
import { createEmptyItemRepository } from "../../support/item-repository";

function createAccount(): AccountRecord {
  return {
    id: "account-1",
    userId: "user-1",
    accessState: "active",
    subscriptionTier: "base",
    trialStartsAt: new Date("2026-04-01T12:00:00.000Z"),
    trialEndsAt: new Date("2026-05-01T12:00:00.000Z"),
    onboardingCompletedAt: null,
  };
}

describe("auditRouter", () => {
  it("returns an empty recent activity list for an account with no events", async () => {
    const account = createAccount();
    const caller = appRouter.createCaller({
      session: {
        userId: account.userId,
        email: "owner@example.com",
      },
      account,
      accountRepository: createEmptyAccountRepository(),
      auditRepository: new InMemoryAuditRepository(),
      handReceiptRepository: createEmptyHandReceiptRepository(),
      itemRepository: createEmptyItemRepository(),
      unitOfWork: createInMemoryAppUnitOfWork(),
    });

    await expect(caller.audit.listRecentActivity()).resolves.toEqual([]);
  });

  it("returns readable activity in reverse chronological order", async () => {
    const account = createAccount();
    const auditRepository = new InMemoryAuditRepository([
      {
        id: "event-1",
        accountId: account.id,
        actorId: account.userId,
        action: "system.initialized",
        targetType: "account",
        targetId: account.id,
        occurredAt: new Date("2026-04-29T12:00:00.000Z"),
        metadata: null,
        createdAt: new Date("2026-04-29T12:00:01.000Z"),
      },
      {
        id: "event-2",
        accountId: account.id,
        actorId: account.userId,
        action: "account.onboarding_completed",
        targetType: "account",
        targetId: account.id,
        occurredAt: new Date("2026-04-29T13:00:00.000Z"),
        metadata: { acknowledgedBoundaryNotice: true },
        createdAt: new Date("2026-04-29T13:00:01.000Z"),
      },
    ]);
    const caller = appRouter.createCaller({
      session: {
        userId: account.userId,
        email: "owner@example.com",
      },
      account,
      accountRepository: createEmptyAccountRepository(),
      auditRepository,
      handReceiptRepository: createEmptyHandReceiptRepository(),
      itemRepository: createEmptyItemRepository(),
      unitOfWork: createInMemoryAppUnitOfWork({ auditRepository }),
    });

    await expect(caller.audit.listRecentActivity()).resolves.toMatchObject([
      {
        id: "event-2",
        label: "Onboarding completed",
      },
      {
        id: "event-1",
        label: "System initialized",
      },
    ]);
  });

  it("returns target-scoped hand receipt activity for the current account", async () => {
    const account = createAccount();
    const otherAccount = {
      ...account,
      id: "account-2",
      userId: "user-2",
    };
    const auditRepository = new InMemoryAuditRepository([
      {
        id: "event-1",
        accountId: account.id,
        actorId: account.userId,
        action: "hand_receipt.created",
        targetType: "hand_receipt",
        targetId: "receipt-1",
        occurredAt: new Date("2026-04-29T12:00:00.000Z"),
        metadata: { name: "Alpha hand receipt" },
        createdAt: new Date("2026-04-29T12:00:01.000Z"),
      },
      {
        id: "event-2",
        accountId: account.id,
        actorId: account.userId,
        action: "hand_receipt.updated",
        targetType: "hand_receipt",
        targetId: "receipt-2",
        occurredAt: new Date("2026-04-29T13:00:00.000Z"),
        metadata: { name: "Bravo hand receipt" },
        createdAt: new Date("2026-04-29T13:00:01.000Z"),
      },
      {
        id: "event-3",
        accountId: otherAccount.id,
        actorId: otherAccount.userId,
        action: "hand_receipt.archived",
        targetType: "hand_receipt",
        targetId: "receipt-1",
        occurredAt: new Date("2026-04-29T14:00:00.000Z"),
        metadata: { name: "Other account receipt" },
        createdAt: new Date("2026-04-29T14:00:01.000Z"),
      },
    ]);
    const caller = appRouter.createCaller({
      session: {
        userId: account.userId,
        email: "owner@example.com",
      },
      account,
      accountRepository: createEmptyAccountRepository(),
      auditRepository,
      handReceiptRepository: createEmptyHandReceiptRepository(),
      itemRepository: createEmptyItemRepository(),
      unitOfWork: createInMemoryAppUnitOfWork({ auditRepository }),
    });

    await expect(
      caller.audit.listTargetActivity({
        targetType: "hand_receipt",
        targetId: "receipt-1",
      }),
    ).resolves.toMatchObject([
      {
        id: "event-1",
        label: "Hand receipt created",
        targetLabel: "Alpha hand receipt",
      },
    ]);
  });

  it("respects the recent activity limit", async () => {
    const account = createAccount();
    const auditRepository = new InMemoryAuditRepository([
      {
        id: "event-1",
        accountId: account.id,
        actorId: account.userId,
        action: "system.initialized",
        targetType: "account",
        targetId: account.id,
        occurredAt: new Date("2026-04-29T12:00:00.000Z"),
        metadata: null,
        createdAt: new Date("2026-04-29T12:00:01.000Z"),
      },
      {
        id: "event-2",
        accountId: account.id,
        actorId: account.userId,
        action: "account.onboarding_completed",
        targetType: "account",
        targetId: account.id,
        occurredAt: new Date("2026-04-29T13:00:00.000Z"),
        metadata: null,
        createdAt: new Date("2026-04-29T13:00:01.000Z"),
      },
    ]);
    const caller = appRouter.createCaller({
      session: {
        userId: account.userId,
        email: "owner@example.com",
      },
      account,
      accountRepository: createEmptyAccountRepository(),
      auditRepository,
      handReceiptRepository: createEmptyHandReceiptRepository(),
      itemRepository: createEmptyItemRepository(),
      unitOfWork: createInMemoryAppUnitOfWork({ auditRepository }),
    });

    await expect(
      caller.audit.listRecentActivity({ limit: 1 }),
    ).resolves.toHaveLength(1);
  });
});
