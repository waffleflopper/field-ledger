import { describe, expect, it } from "vitest";

import { appRouter } from "@/server/trpc/router";
import { createEmptyAccountRepository } from "../../support/account-repository";
import { createEmptyAuditRepository } from "../../support/audit-repository";

describe("billingRouter", () => {
  it("serves current account capabilities through the typed tRPC boundary", async () => {
    const now = Date.now();
    const caller = appRouter.createCaller({
      session: {
        userId: "user-1",
        email: "owner@example.com",
      },
      account: {
        id: "account-1",
        userId: "user-1",
        accessState: "active",
        subscriptionTier: "base",
        trialStartsAt: new Date(now - 7 * 24 * 60 * 60 * 1000),
        trialEndsAt: new Date(now + 23 * 24 * 60 * 60 * 1000),
      },
      accountRepository: createEmptyAccountRepository(),
      auditRepository: createEmptyAuditRepository(),
    });

    await expect(caller.billing.capabilities()).resolves.toMatchObject({
      isReadOnly: false,
      activeHandReceiptLimit: 3,
      subscriptionTier: "base",
    });
  });
});
