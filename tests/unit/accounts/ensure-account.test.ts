import { describe, expect, it } from "vitest";

import {
  ensureAccount,
  type AccountRecord,
  type AccountRepository,
} from "@/modules/accounts/application/ensure-account";

class InMemoryAccountRepository implements AccountRepository {
  private accounts = new Map<string, AccountRecord>();

  async findById(accountId: string) {
    return this.accounts.get(accountId) ?? null;
  }

  async create(account: AccountRecord) {
    if (this.accounts.has(account.id)) {
      return this.accounts.get(account.id) ?? null;
    }

    this.accounts.set(account.id, account);
    return account;
  }
}

describe("ensureAccount", () => {
  it("creates a new owner account with 30-day trial access", async () => {
    const repository = new InMemoryAccountRepository();
    const now = new Date("2026-04-29T12:00:00.000Z");

    await expect(
      ensureAccount({
        userId: "5d44c151-92e4-486f-8ff1-5daf0b3f7ad5",
        now,
        repository,
      }),
    ).resolves.toMatchObject({
      id: "5d44c151-92e4-486f-8ff1-5daf0b3f7ad5",
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
    });
    const secondAccount = await ensureAccount({
      userId,
      now: secondRun,
      repository,
    });

    expect(secondAccount).toEqual(firstAccount);
    expect(secondAccount.trialStartsAt).toEqual(firstRun);
    expect(secondAccount.trialEndsAt).toEqual(
      new Date("2026-05-29T12:00:00.000Z"),
    );
  });
});
