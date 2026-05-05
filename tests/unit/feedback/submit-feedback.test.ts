import { describe, expect, it, vi } from "vitest";

import { submitFeedback } from "@/modules/feedback";
import type { GitHubIssuesPort } from "@/modules/provider-boundaries/github/issues";

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

describe("submitFeedback", () => {
  it("files feedback as a triage GitHub issue", async () => {
    const feedbackPort = createFeedbackPort();

    await expect(
      submitFeedback({
        feedbackPort,
        input: {
          message: "The item page save button got stuck.",
          pageUrl: "https://field-ledger.test/app/items/item-1",
        },
      }),
    ).resolves.toEqual({
      number: 42,
      url: "https://github.com/waffleflopper/field-ledger/issues/42",
    });

    expect(feedbackPort.createIssue).toHaveBeenCalledWith({
      title: "Field Ledger feedback",
      labels: ["needs-triage", "feedback"],
      body: expect.stringContaining("The item page save button got stuck."),
    });
    expect(feedbackPort.createIssue).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.stringContaining(
          "Page: https://field-ledger.test/app/items/item-1",
        ),
      }),
    );
    expect(feedbackPort.createIssue).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.not.stringContaining("owner@example.com"),
      }),
    );
    expect(feedbackPort.createIssue).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.not.stringContaining("account-1"),
      }),
    );
    expect(feedbackPort.createIssue).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.not.stringContaining("owner-1"),
      }),
    );
  });

  it("rejects empty feedback", async () => {
    const feedbackPort = createFeedbackPort();

    await expect(
      submitFeedback({
        feedbackPort,
        input: { message: "   " },
      }),
    ).rejects.toThrow("Feedback message is required.");
    expect(feedbackPort.createIssue).not.toHaveBeenCalled();
  });
});
