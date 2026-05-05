import { describe, expect, it } from "vitest";

import {
  getBillingStatusDisplay,
  type BillingStatusDisplayInput,
} from "@/modules/billing";

const now = new Date("2026-05-05T12:00:00.000Z");

function createStatus(
  overrides: Partial<BillingStatusDisplayInput> = {},
): BillingStatusDisplayInput {
  return {
    accessState: "trialing",
    subscriptionTier: null,
    isReadOnly: false,
    activeHandReceiptLimit: null,
    trialEndsAt: new Date("2026-05-15T12:00:00.000Z"),
    ...overrides,
  };
}

describe("getBillingStatusDisplay", () => {
  it("describes an active trial as Pro-like with unlimited hand receipts", () => {
    const display = getBillingStatusDisplay(createStatus(), now);

    expect(display).toMatchObject({
      planLabel: "Trial access",
      stateLabel: "Trial active",
      accessWindowLabel: "10 days left in trial",
      handReceiptLimitLabel: "Unlimited active hand receipts",
    });
  });

  it("describes an expired trial as read-only", () => {
    const display = getBillingStatusDisplay(
      createStatus({
        accessState: "trialing",
        isReadOnly: true,
        activeHandReceiptLimit: 0,
        trialEndsAt: new Date("2026-05-01T12:00:00.000Z"),
      }),
      now,
    );

    expect(display.stateLabel).toBe("Read-only");
    expect(display.accessWindowLabel).toBe("Trial ended May 1, 2026");
    expect(display.handReceiptLimitLabel).toBe(
      "New hand receipts unavailable in read-only mode",
    );
  });

  it("describes Base plan limits", () => {
    const display = getBillingStatusDisplay(
      createStatus({
        accessState: "active",
        subscriptionTier: "base",
        activeHandReceiptLimit: 3,
      }),
      now,
    );

    expect(display.planLabel).toBe("Base");
    expect(display.stateLabel).toBe("Active");
    expect(display.accessWindowLabel).toBe("Plan-backed access");
    expect(display.handReceiptLimitLabel).toBe("3 active hand receipts");
  });

  it("describes Pro plan limits", () => {
    const display = getBillingStatusDisplay(
      createStatus({
        accessState: "active",
        subscriptionTier: "pro",
        activeHandReceiptLimit: null,
      }),
      now,
    );

    expect(display.planLabel).toBe("Pro");
    expect(display.accessWindowLabel).toBe("Plan-backed access");
    expect(display.handReceiptLimitLabel).toBe(
      "Unlimited active hand receipts",
    );
  });

  it("describes paused accounts in plain language", () => {
    const display = getBillingStatusDisplay(
      createStatus({
        accessState: "paused_read_only",
        subscriptionTier: "base",
        isReadOnly: true,
        activeHandReceiptLimit: 0,
      }),
      now,
    );

    expect(display.planLabel).toBe("Base");
    expect(display.stateLabel).toBe("Read-only");
    expect(display.stateDescription).toContain("review existing records");
  });
});
