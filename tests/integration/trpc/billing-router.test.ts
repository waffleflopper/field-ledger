import { describe, expect, it } from "vitest";

import { appRouter } from "@/server/trpc/router";

describe("billingRouter", () => {
  it("serves current account capabilities through the typed tRPC boundary", async () => {
    const caller = appRouter.createCaller({
      session: {
        userId: "user-1",
        email: "owner@example.com",
      },
      account: {
        id: "user-1",
        accessState: "active",
        subscriptionTier: "base",
        trialStartsAt: new Date("2026-04-01T12:00:00.000Z"),
        trialEndsAt: new Date("2026-05-01T12:00:00.000Z"),
      },
    });

    await expect(caller.billing.capabilities()).resolves.toMatchObject({
      isReadOnly: false,
      activeHandReceiptLimit: 3,
      subscriptionTier: "base",
    });
  });
});
