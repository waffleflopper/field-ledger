import { TRPCError } from "@trpc/server";
import { describe, expect, it } from "vitest";

import { createTRPCRouter, protectedProcedure } from "@/server/trpc/init";

const authProbeRouter = createTRPCRouter({
  currentUserEmail: protectedProcedure.query(({ ctx }) => ctx.session.email),
});

describe("protectedProcedure", () => {
  it("rejects callers without an app session", async () => {
    const caller = authProbeRouter.createCaller({
      session: null,
      account: null,
    });

    await expect(caller.currentUserEmail()).rejects.toMatchObject({
      code: "UNAUTHORIZED" satisfies TRPCError["code"],
    });
  });

  it("rejects callers without an initialized owner account", async () => {
    const caller = authProbeRouter.createCaller({
      session: {
        userId: "user-1",
        email: "owner@example.com",
      },
      account: null,
    });

    await expect(caller.currentUserEmail()).rejects.toMatchObject({
      code: "UNAUTHORIZED" satisfies TRPCError["code"],
    });
  });

  it("allows callers with an app session", async () => {
    const caller = authProbeRouter.createCaller({
      session: {
        userId: "user-1",
        email: "owner@example.com",
      },
      account: {
        id: "user-1",
        accessState: "trialing",
        subscriptionTier: null,
        trialStartsAt: new Date("2026-04-29T12:00:00.000Z"),
        trialEndsAt: new Date("2026-05-29T12:00:00.000Z"),
      },
    });

    await expect(caller.currentUserEmail()).resolves.toBe("owner@example.com");
  });
});
