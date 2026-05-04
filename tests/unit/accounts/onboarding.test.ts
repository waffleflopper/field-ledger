import { describe, expect, it } from "vitest";

import {
  completeOnboarding,
  getOnboardingStatus,
  type AccountRecord,
} from "@/modules/accounts/application/ensure-account";
import { InMemoryAccountRepository } from "../../support/account-repository";
import { InMemoryAuditRepository } from "../../support/audit-repository";

const trialAccount: AccountRecord = {
  id: "6a9b6ae8-ed65-4f5a-b8c3-585cf141abce",
  userId: "e95e817e-31f8-450e-86ac-b1fd269321e4",
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
    const auditRepository = new InMemoryAuditRepository();
    const completedAt = new Date("2026-04-30T12:00:00.000Z");

    await expect(
      completeOnboarding({
        account: trialAccount,
        completedAt,
        repository,
        auditRepository,
      }),
    ).resolves.toMatchObject({
      completed: true,
      completedAt,
    });
    expect(auditRepository.events).toMatchObject([
      {
        accountId: trialAccount.id,
        actorId: trialAccount.userId,
        action: "account.onboarding_completed",
        targetType: "account",
        targetId: trialAccount.id,
        occurredAt: completedAt,
        metadata: {
          acknowledgedBoundaryNotice: true,
        },
      },
    ]);

    await expect(
      completeOnboarding({
        account: {
          ...trialAccount,
          onboardingCompletedAt: completedAt,
        },
        completedAt: new Date("2026-05-01T12:00:00.000Z"),
        repository,
        auditRepository,
      }),
    ).resolves.toMatchObject({
      completed: true,
      completedAt,
    });
    expect(auditRepository.events).toHaveLength(1);
  });
});
