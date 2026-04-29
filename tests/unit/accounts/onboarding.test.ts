import { describe, expect, it } from "vitest";

import {
  completeOnboarding,
  getOnboardingStatus,
  type AccountRecord,
} from "@/modules/accounts/application/ensure-account";
import { InMemoryAccountRepository } from "../../support/account-repository";

const trialAccount: AccountRecord = {
  id: "6a9b6ae8-ed65-4f5a-b8c3-585cf141abce",
  accessState: "trialing",
  subscriptionTier: null,
  trialStartsAt: new Date("2026-04-29T12:00:00.000Z"),
  trialEndsAt: new Date("2026-05-29T12:00:00.000Z"),
  onboardingCompletedAt: null,
};

describe("account onboarding", () => {
  it("reports first-run status with effective account access", () => {
    expect(
      getOnboardingStatus({
        account: trialAccount,
        now: new Date("2026-04-29T12:00:00.000Z"),
      }),
    ).toEqual({
      completed: false,
      completedAt: null,
      accessState: "trialing",
      isReadOnly: false,
    });
  });

  it("uses centralized capability rules for expired trial read-only status", () => {
    expect(
      getOnboardingStatus({
        account: {
          ...trialAccount,
          trialEndsAt: new Date("2026-04-28T12:00:00.000Z"),
        },
        now: new Date("2026-04-29T12:00:00.000Z"),
      }),
    ).toMatchObject({
      completed: false,
      accessState: "paused_read_only",
      isReadOnly: true,
    });
  });

  it("marks onboarding complete idempotently", async () => {
    const repository = new InMemoryAccountRepository([trialAccount]);
    const completedAt = new Date("2026-04-30T12:00:00.000Z");

    await expect(
      completeOnboarding({
        account: trialAccount,
        completedAt,
        repository,
      }),
    ).resolves.toMatchObject({
      completed: true,
      completedAt,
    });

    await expect(
      completeOnboarding({
        account: {
          ...trialAccount,
          onboardingCompletedAt: completedAt,
        },
        completedAt: new Date("2026-05-01T12:00:00.000Z"),
        repository,
      }),
    ).resolves.toMatchObject({
      completed: true,
      completedAt,
    });
  });
});
