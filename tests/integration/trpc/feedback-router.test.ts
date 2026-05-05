import { describe, expect, it, vi } from "vitest";

import type { AccountRecord } from "@/modules/accounts/application/ensure-account";
import type { GitHubIssuesPort } from "@/modules/provider-boundaries/github/issues";
import { appRouter } from "@/server/trpc/router";
import { InMemoryAccountRepository } from "../../support/account-repository";
import { createEmptyAuditRepository } from "../../support/audit-repository";
import { createInMemoryAppUnitOfWork } from "../../support/app-unit-of-work";
import { createEmptyContactRepository } from "../../support/contact-repository";
import { createEmptyHandReceiptRepository } from "../../support/hand-receipt-repository";
import { createEmptyItemRepository } from "../../support/item-repository";
import { createEmptyLocationRepository } from "../../support/location-repository";
import { createEmptyRequirementRepository } from "../../support/requirement-repository";

function createAccount(overrides: Partial<AccountRecord> = {}): AccountRecord {
  return {
    id: "account-1",
    userId: "owner-1",
    accessState: "active",
    subscriptionTier: "base",
    trialStartsAt: new Date("2026-04-01T12:00:00.000Z"),
    trialEndsAt: new Date("2100-01-01T00:00:00.000Z"),
    onboardingCompletedAt: null,
    ...overrides,
  };
}

function createFeedbackPort(): GitHubIssuesPort & {
  createIssue: ReturnType<typeof vi.fn<GitHubIssuesPort["createIssue"]>>;
} {
  return {
    createIssue: vi.fn(async () => ({
      number: 42,
      url: "https://github.com/waffleflopper/field-ledger/issues/42",
    })),
  };
}

function createCaller({
  feedbackPort = createFeedbackPort(),
}: {
  feedbackPort?: GitHubIssuesPort;
} = {}) {
  const account = createAccount();
  const accountRepository = new InMemoryAccountRepository([account]);

  return appRouter.createCaller({
    session: {
      userId: account.userId,
      email: "owner@example.com",
    },
    account,
    accountRepository,
    auditRepository: createEmptyAuditRepository(),
    contactRepository: createEmptyContactRepository(),
    githubIssuesPort: feedbackPort,
    handReceiptRepository: createEmptyHandReceiptRepository(),
    itemRepository: createEmptyItemRepository(),
    locationRepository: createEmptyLocationRepository(),
    requirementRepository: createEmptyRequirementRepository(),
    unitOfWork: createInMemoryAppUnitOfWork({
      accountRepository,
    }),
  });
}

describe("feedbackRouter", () => {
  it("submits feedback through the GitHub issue provider", async () => {
    const feedbackPort = createFeedbackPort();
    const caller = createCaller({ feedbackPort });

    await expect(
      caller.feedback.submit({
        message: "The dashboard count looked wrong.",
        pageUrl: "https://field-ledger.test/app/dashboard",
      }),
    ).resolves.toEqual({
      number: 42,
      url: "https://github.com/waffleflopper/field-ledger/issues/42",
    });

    expect(feedbackPort.createIssue).toHaveBeenCalledWith(
      expect.objectContaining({
        labels: ["needs-triage", "feedback"],
        title: "Field Ledger feedback",
      }),
    );
  });

  it("maps missing GitHub configuration to a setup error", async () => {
    const caller = createCaller({
      feedbackPort: {
        async createIssue() {
          throw new Error("A GitHub issue provider is required.");
        },
      },
    });

    await expect(
      caller.feedback.submit({
        message: "Nothing happens when I tap archive.",
      }),
    ).rejects.toMatchObject({
      code: "PRECONDITION_FAILED",
      message: "Feedback is not configured.",
    });
  });
});
