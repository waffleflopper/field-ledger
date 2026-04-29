import { describe, expect, it } from "vitest";

import { appRouter } from "@/server/trpc/router";
import type { AccountRecord } from "@/modules/accounts/application/ensure-account";
import { InMemoryAccountRepository } from "../../support/account-repository";

const account: AccountRecord = {
  id: "user-1",
  accessState: "active",
  subscriptionTier: "base",
  trialStartsAt: new Date("2026-04-01T12:00:00.000Z"),
  trialEndsAt: new Date("2026-05-01T12:00:00.000Z"),
  onboardingCompletedAt: null,
};

describe("accountsRouter", () => {
  it("serves and completes onboarding through the typed tRPC boundary", async () => {
    const caller = appRouter.createCaller({
      session: {
        userId: "user-1",
        email: "owner@example.com",
      },
      account,
      accountRepository: new InMemoryAccountRepository([account]),
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
  });
});
