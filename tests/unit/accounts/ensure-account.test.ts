import { describe, expect, it } from "vitest";

import { ensureAccount } from "@/modules/accounts/application/ensure-account";
import { InMemoryAccountRepository } from "../../support/account-repository";

describe("ensureAccount", () => {
  it("creates a new owner account with 30-day trial access", async () => {
    const repository = new InMemoryAccountRepository();
    const now = new Date("2026-04-29T12:00:00.000Z");
    const userId = "5d44c151-92e4-486f-8ff1-5daf0b3f7ad5";

    await expect(
      ensureAccount({
        userId,
        now,
        repository,
        createAccountId: () => "03afbb37-4faa-4062-992d-1f8993351b7f",
      }),
    ).resolves.toMatchObject({
      id: "03afbb37-4faa-4062-992d-1f8993351b7f",
      userId,
      accessState: "trialing",
      subscriptionTier: null,
      trialStartsAt: now,
      trialEndsAt: new Date("2026-05-29T12:00:00.000Z"),
    });
  });

  it("returns the existing owner account without resetting trial dates", async () => {
    const repository = new InMemoryAccountRepository();
    const userId = "3f90ec33-7d81-45f2-bf7c-968e8c5498ce";
    const firstRun = new Date("2026-04-29T12:00:00.000Z");
    const secondRun = new Date("2026-05-10T12:00:00.000Z");

    const firstAccount = await ensureAccount({
      userId,
      now: firstRun,
      repository,
      createAccountId: () => "f93525d8-f40c-496c-9171-8446eb83cabd",
    });
    const secondAccount = await ensureAccount({
      userId,
      now: secondRun,
      repository,
      createAccountId: () => "2344b361-5030-4fe3-b18c-a1724cbfbd84",
    });

    expect(secondAccount).toEqual(firstAccount);
    expect(secondAccount.id).toBe("f93525d8-f40c-496c-9171-8446eb83cabd");
    expect(secondAccount.userId).toBe(userId);
    expect(secondAccount.trialStartsAt).toEqual(firstRun);
    expect(secondAccount.trialEndsAt).toEqual(
      new Date("2026-05-29T12:00:00.000Z"),
    );
  });
});
