import { TRPCError } from "@trpc/server";
import { describe, expect, it } from "vitest";

import type { AccountRecord } from "@/modules/accounts/application/ensure-account";
import { appRouter } from "@/server/trpc/router";
import { createEmptyAccountRepository } from "../../support/account-repository";
import { InMemoryAuditRepository } from "../../support/audit-repository";
import { InMemoryHandReceiptRepository } from "../../support/hand-receipt-repository";

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
  handReceiptRepository = new InMemoryHandReceiptRepository(),
  auditRepository = new InMemoryAuditRepository(),
}: {
  account?: AccountRecord;
  handReceiptRepository?: InMemoryHandReceiptRepository;
  auditRepository?: InMemoryAuditRepository;
} = {}) {
  return appRouter.createCaller({
    session: {
      userId: account.userId,
      email: "owner@example.com",
    },
    account,
    accountRepository: createEmptyAccountRepository(),
    auditRepository,
    handReceiptRepository,
  });
}

describe("handReceiptsRouter", () => {
  it("creates a hand receipt and returns it from the active list", async () => {
    const repository = new InMemoryHandReceiptRepository();
    const caller = createCaller({ handReceiptRepository: repository });

    const created = await caller.handReceipts.create({
      name: "HQ hand receipt",
      notes: "Primary field set.",
    });

    expect(created).toMatchObject({
      accountId: "account-1",
      name: "HQ hand receipt",
      notes: "Primary field set.",
      status: "active",
    });
    await expect(caller.handReceipts.list()).resolves.toMatchObject([
      {
        id: created.id,
        name: "HQ hand receipt",
      },
    ]);
  });

  it("returns an empty list when there are no active hand receipts", async () => {
    await expect(createCaller().handReceipts.list()).resolves.toEqual([]);
  });

  it("validates required names through the typed procedure", async () => {
    await expect(
      createCaller().handReceipts.create({
        name: "",
      }),
    ).rejects.toBeInstanceOf(TRPCError);
  });

  it("enforces capability limits through the typed procedure", async () => {
    const repository = new InMemoryHandReceiptRepository([
      {
        id: "active-1",
        accountId: "account-1",
        name: "Alpha",
        notes: null,
        handReceiptNumber: null,
        holderName: null,
        unitName: null,
        uic: null,
        effectiveDate: null,
        status: "active",
        createdAt: new Date("2026-04-01T12:00:00.000Z"),
        updatedAt: new Date("2026-04-01T12:00:00.000Z"),
      },
      {
        id: "active-2",
        accountId: "account-1",
        name: "Bravo",
        notes: null,
        handReceiptNumber: null,
        holderName: null,
        unitName: null,
        uic: null,
        effectiveDate: null,
        status: "active",
        createdAt: new Date("2026-04-02T12:00:00.000Z"),
        updatedAt: new Date("2026-04-02T12:00:00.000Z"),
      },
      {
        id: "active-3",
        accountId: "account-1",
        name: "Charlie",
        notes: null,
        handReceiptNumber: null,
        holderName: null,
        unitName: null,
        uic: null,
        effectiveDate: null,
        status: "active",
        createdAt: new Date("2026-04-03T12:00:00.000Z"),
        updatedAt: new Date("2026-04-03T12:00:00.000Z"),
      },
    ]);

    await expect(
      createCaller({ handReceiptRepository: repository }).handReceipts.create({
        name: "Delta",
      }),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "Active hand receipt limit reached.",
    });
  });
});
