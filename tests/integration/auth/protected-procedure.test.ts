import { TRPCError } from "@trpc/server";
import { describe, expect, it } from "vitest";

import { createTRPCRouter, protectedProcedure } from "@/server/trpc/init";

const authProbeRouter = createTRPCRouter({
  currentUserEmail: protectedProcedure.query(({ ctx }) => ctx.session.email),
});

describe("protectedProcedure", () => {
  it("rejects callers without an app session", async () => {
    const caller = authProbeRouter.createCaller({ session: null });

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
    });

    await expect(caller.currentUserEmail()).resolves.toBe("owner@example.com");
  });
});
