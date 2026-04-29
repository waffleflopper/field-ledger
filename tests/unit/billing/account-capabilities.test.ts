import { describe, expect, it } from "vitest";

import {
  canCreateHandReceipt,
  deriveAccountCapabilities,
  getActiveHandReceiptLimit,
  isAccountReadOnly,
} from "@/modules/billing";

const now = new Date("2026-04-29T12:00:00.000Z");

describe("account billing capabilities", () => {
  it("gives non-expired trial accounts Pro-like capabilities", () => {
    const capabilities = deriveAccountCapabilities(
      {
        accessState: "trialing",
        subscriptionTier: null,
        trialEndsAt: new Date("2026-05-29T12:00:00.000Z"),
      },
      now,
    );

    expect(isAccountReadOnly(capabilities)).toBe(false);
    expect(getActiveHandReceiptLimit(capabilities)).toBe(null);
    expect(canCreateHandReceipt(capabilities, 25)).toBe(true);
  });

  it("limits active Base accounts to three active hand receipts", () => {
    const capabilities = deriveAccountCapabilities({
      accessState: "active",
      subscriptionTier: "base",
      trialEndsAt: new Date("2026-04-01T12:00:00.000Z"),
    });

    expect(isAccountReadOnly(capabilities)).toBe(false);
    expect(getActiveHandReceiptLimit(capabilities)).toBe(3);
    expect(canCreateHandReceipt(capabilities, 2)).toBe(true);
    expect(canCreateHandReceipt(capabilities, 3)).toBe(false);
  });

  it("allows active Pro accounts unlimited active hand receipts", () => {
    const capabilities = deriveAccountCapabilities({
      accessState: "active",
      subscriptionTier: "pro",
      trialEndsAt: new Date("2026-04-01T12:00:00.000Z"),
    });

    expect(isAccountReadOnly(capabilities)).toBe(false);
    expect(getActiveHandReceiptLimit(capabilities)).toBe(null);
    expect(canCreateHandReceipt(capabilities, 300)).toBe(true);
  });

  it("resolves expired trials with no active plan to read-only", () => {
    const capabilities = deriveAccountCapabilities(
      {
        accessState: "trialing",
        subscriptionTier: null,
        trialEndsAt: new Date("2026-04-28T12:00:00.000Z"),
      },
      now,
    );

    expect(isAccountReadOnly(capabilities)).toBe(true);
    expect(canCreateHandReceipt(capabilities, 0)).toBe(false);
  });

  it("keeps paused accounts read-only regardless of tier", () => {
    const capabilities = deriveAccountCapabilities({
      accessState: "paused_read_only",
      subscriptionTier: "pro",
      trialEndsAt: new Date("2026-05-29T12:00:00.000Z"),
    });

    expect(isAccountReadOnly(capabilities)).toBe(true);
    expect(canCreateHandReceipt(capabilities, 0)).toBe(false);
  });
});
