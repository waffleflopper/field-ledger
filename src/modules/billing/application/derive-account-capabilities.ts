import type {
  AccountAccessData,
  AccountCapabilities,
} from "@/modules/billing/application/types";

const baseActiveHandReceiptLimit = 3;

export function deriveAccountCapabilities(
  account: AccountAccessData,
  now = new Date(),
): AccountCapabilities {
  if (account.accessState === "paused_read_only") {
    return toReadOnlyCapabilities(account);
  }

  if (account.accessState === "trialing") {
    if (account.trialEndsAt > now) {
      return {
        accessState: account.accessState,
        subscriptionTier: account.subscriptionTier,
        isReadOnly: false,
        activeHandReceiptLimit: null,
      };
    }

    return toReadOnlyCapabilities(account);
  }

  if (account.subscriptionTier === "base") {
    return {
      accessState: account.accessState,
      subscriptionTier: account.subscriptionTier,
      isReadOnly: false,
      activeHandReceiptLimit: baseActiveHandReceiptLimit,
    };
  }

  if (account.subscriptionTier === "pro") {
    return {
      accessState: account.accessState,
      subscriptionTier: account.subscriptionTier,
      isReadOnly: false,
      activeHandReceiptLimit: null,
    };
  }

  return toReadOnlyCapabilities(account);
}

function toReadOnlyCapabilities(
  account: AccountAccessData,
): AccountCapabilities {
  return {
    accessState: "paused_read_only",
    subscriptionTier: account.subscriptionTier,
    isReadOnly: true,
    activeHandReceiptLimit: 0,
  };
}
