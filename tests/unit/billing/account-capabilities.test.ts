import { describe, expect, it } from "vitest";

import {
  canArchiveHandReceipt,
  canClose2062Assignment,
  canCreateHandReceipt,
  canCreateRequirement,
  canEditRequirement,
  canMoveItem,
  canRemove2062ItemLink,
  canRestoreHandReceipt,
  canUploadDocument,
  deriveAccountCapabilities,
  getActiveHandReceiptLimit,
  isAccountReadOnly,
} from "@/modules/billing";
import type { AccountAccessData, AccountCapabilities } from "@/modules/billing";

const now = new Date("2026-04-29T12:00:00.000Z");

describe("account billing capabilities", () => {
  const activeTrial: AccountAccessData = {
    accessState: "trialing",
    subscriptionTier: null,
    trialEndsAt: new Date("2026-05-29T12:00:00.000Z"),
  };
  const expiredTrial: AccountAccessData = {
    accessState: "trialing",
    subscriptionTier: null,
    trialEndsAt: new Date("2026-04-28T12:00:00.000Z"),
  };
  const activeBase: AccountAccessData = {
    accessState: "active",
    subscriptionTier: "base",
    trialEndsAt: new Date("2026-04-01T12:00:00.000Z"),
  };
  const activePro: AccountAccessData = {
    accessState: "active",
    subscriptionTier: "pro",
    trialEndsAt: new Date("2026-04-01T12:00:00.000Z"),
  };
  const pausedReadOnly: AccountAccessData = {
    accessState: "paused_read_only",
    subscriptionTier: "pro",
    trialEndsAt: new Date("2026-05-29T12:00:00.000Z"),
  };

  it("gives non-expired trial accounts Pro-like capabilities", () => {
    const capabilities = deriveAccountCapabilities(activeTrial, now);

    expect(isAccountReadOnly(capabilities)).toBe(false);
    expect(getActiveHandReceiptLimit(capabilities)).toBe(null);
    expect(canCreateHandReceipt(capabilities, 25)).toBe(true);
    expect(canRestoreHandReceipt(capabilities, 25)).toBe(true);
  });

  it("limits active Base accounts to three active hand receipts", () => {
    const capabilities = deriveAccountCapabilities(activeBase);

    expect(isAccountReadOnly(capabilities)).toBe(false);
    expect(getActiveHandReceiptLimit(capabilities)).toBe(3);
    expect(canCreateHandReceipt(capabilities, 2)).toBe(true);
    expect(canCreateHandReceipt(capabilities, 3)).toBe(false);
    expect(canRestoreHandReceipt(capabilities, 2)).toBe(true);
    expect(canRestoreHandReceipt(capabilities, 3)).toBe(false);
  });

  it("allows active Pro accounts unlimited active hand receipts", () => {
    const capabilities = deriveAccountCapabilities(activePro);

    expect(isAccountReadOnly(capabilities)).toBe(false);
    expect(getActiveHandReceiptLimit(capabilities)).toBe(null);
    expect(canCreateHandReceipt(capabilities, 300)).toBe(true);
    expect(canRestoreHandReceipt(capabilities, 300)).toBe(true);
  });

  it("resolves expired trials with no active plan to read-only", () => {
    const capabilities = deriveAccountCapabilities(expiredTrial, now);

    expect(isAccountReadOnly(capabilities)).toBe(true);
    expect(canCreateHandReceipt(capabilities, 0)).toBe(false);
    expect(canArchiveHandReceipt(capabilities)).toBe(false);
    expect(canRestoreHandReceipt(capabilities, 0)).toBe(false);
  });

  it("keeps paused accounts read-only regardless of tier", () => {
    const capabilities = deriveAccountCapabilities(pausedReadOnly);

    expect(isAccountReadOnly(capabilities)).toBe(true);
    expect(canCreateHandReceipt(capabilities, 0)).toBe(false);
    expect(canArchiveHandReceipt(capabilities)).toBe(false);
    expect(canRestoreHandReceipt(capabilities, 0)).toBe(false);
  });

  it("allows archive for writable accounts", () => {
    const capabilities = deriveAccountCapabilities(activeBase);

    expect(canArchiveHandReceipt(capabilities)).toBe(true);
  });

  describe("write capability helpers", () => {
    const helpers: Array<{
      name: string;
      check: (capabilities: AccountCapabilities) => boolean;
    }> = [
      { name: "canMoveItem", check: canMoveItem },
      { name: "canCreateRequirement", check: canCreateRequirement },
      { name: "canUploadDocument", check: canUploadDocument },
      { name: "canClose2062Assignment", check: canClose2062Assignment },
      { name: "canRemove2062ItemLink", check: canRemove2062ItemLink },
      { name: "canEditRequirement", check: canEditRequirement },
    ];

    it.each(helpers)(
      "$name follows the shared read-only capability rule",
      ({ check }) => {
        const activeTrialCapabilities = deriveAccountCapabilities(
          activeTrial,
          now,
        );
        const expiredTrialCapabilities = deriveAccountCapabilities(
          expiredTrial,
          now,
        );
        const baseCapabilities = deriveAccountCapabilities(activeBase, now);
        const proCapabilities = deriveAccountCapabilities(activePro, now);
        const pausedCapabilities = deriveAccountCapabilities(
          pausedReadOnly,
          now,
        );

        expect(check(activeTrialCapabilities)).toBe(true);
        expect(check(baseCapabilities)).toBe(true);
        expect(check(proCapabilities)).toBe(true);
        expect(check(expiredTrialCapabilities)).toBe(false);
        expect(check(pausedCapabilities)).toBe(false);
      },
    );
  });
});
