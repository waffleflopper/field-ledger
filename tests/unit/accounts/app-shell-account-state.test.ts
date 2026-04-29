import { describe, expect, it } from "vitest";

import { getAppShellAccountState } from "@/modules/accounts/application/app-shell-account-state";
import { InMemoryAccountRepository } from "../../support/account-repository";

describe("app shell account state", () => {
  it("initializes the owner account before returning shell access state", async () => {
    const repository = new InMemoryAccountRepository();
    const now = new Date("2026-04-29T12:00:00.000Z");

    await expect(
      getAppShellAccountState({
        session: {
          userId: "f2facf85-eb81-4347-a468-166f38e58abc",
          email: "owner@example.test",
        },
        repository,
        now,
        createAccountId: () => "80e196ce-3b2d-4b0c-9378-3aa2cacdf4d8",
      }),
    ).resolves.toMatchObject({
      account: {
        id: "80e196ce-3b2d-4b0c-9378-3aa2cacdf4d8",
        userId: "f2facf85-eb81-4347-a468-166f38e58abc",
      },
      capabilities: {
        accessState: "trialing",
        isReadOnly: false,
        activeHandReceiptLimit: null,
      },
      onboardingStatus: {
        completed: false,
        accessState: "trialing",
        isReadOnly: false,
      },
    });
  });
});
