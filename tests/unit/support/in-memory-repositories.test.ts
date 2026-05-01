import { describe, expect, it } from "vitest";

import type { AccountRecord } from "@/modules/accounts/application/ensure-account";
import { InMemoryAccountRepository } from "../../support/account-repository";
import { createInMemoryAppUnitOfWork } from "../../support/app-unit-of-work";
import { InMemoryContactRepository } from "../../support/contact-repository";
import { InMemoryLocationRepository } from "../../support/location-repository";

const writableAccount: AccountRecord = {
  id: "account-1",
  userId: "owner-1",
  accessState: "active",
  subscriptionTier: "base",
  trialStartsAt: new Date("2026-04-01T12:00:00.000Z"),
  trialEndsAt: new Date("2100-01-01T00:00:00.000Z"),
  onboardingCompletedAt: null,
};

describe("in-memory test repositories", () => {
  it("fails generated item ID allocation for unknown accounts", async () => {
    const repository = new InMemoryAccountRepository();

    await expect(
      repository.incrementAndGetNextItemSequence("missing-account"),
    ).rejects.toThrow("Unable to allocate generated item ID.");
  });

  it("restores account records and item sequence counters on unit-of-work rollback", async () => {
    const accountRepository = new InMemoryAccountRepository([writableAccount]);
    const unitOfWork = createInMemoryAppUnitOfWork({ accountRepository });

    await expect(
      unitOfWork.run(async ({ accountRepository }) => {
        await accountRepository.create({
          ...writableAccount,
          id: "account-2",
          userId: "owner-2",
        });
        await accountRepository.incrementAndGetNextItemSequence(
          writableAccount.id,
        );

        throw new Error("force rollback");
      }),
    ).rejects.toThrow("force rollback");

    await expect(accountRepository.findByUserId("owner-2")).resolves.toBeNull();
    await expect(
      accountRepository.incrementAndGetNextItemSequence(writableAccount.id),
    ).resolves.toBe(1);
  });

  it("generates contact timestamps when widened input carries undefined timestamps", async () => {
    const repository = new InMemoryContactRepository();

    const contact = await repository.create({
      id: "contact-1",
      accountId: "account-1",
      displayName: "SSG Rivera",
      createdAt: undefined,
      updatedAt: undefined,
    } as unknown as Parameters<InMemoryContactRepository["create"]>[0]);

    expect(contact.createdAt).toBeInstanceOf(Date);
    expect(contact.updatedAt).toBeInstanceOf(Date);
  });

  it("generates location timestamps when widened input carries undefined timestamps", async () => {
    const repository = new InMemoryLocationRepository();

    const location = await repository.create({
      id: "location-1",
      accountId: "account-1",
      name: "Arms room",
      createdAt: undefined,
      updatedAt: undefined,
    } as unknown as Parameters<InMemoryLocationRepository["create"]>[0]);

    expect(location.createdAt).toBeInstanceOf(Date);
    expect(location.updatedAt).toBeInstanceOf(Date);
  });
});
