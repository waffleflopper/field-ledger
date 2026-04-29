import { describe, expect, it } from "vitest";

import { appRouter } from "@/server/trpc/router";
import { createEmptyAccountRepository } from "../../support/account-repository";

describe("foundationRouter", () => {
  it("serves health through the typed tRPC caller", async () => {
    const caller = appRouter.createCaller({
      session: null,
      account: null,
      accountRepository: createEmptyAccountRepository(),
    });

    await expect(caller.foundation.health()).resolves.toMatchObject({
      status: "ok",
      api: "trpc",
      queryClient: "tanstack-query",
    });
  });
});
