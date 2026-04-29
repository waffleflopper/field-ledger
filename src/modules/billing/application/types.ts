import type {
  AccessState,
  SubscriptionTier,
} from "@/modules/accounts/application/ensure-account";

export type { AccessState, SubscriptionTier };

export type AccountAccessData = {
  accessState: AccessState;
  subscriptionTier: SubscriptionTier | null;
  trialEndsAt: Date;
};

export type AccountCapabilities = {
  accessState: AccessState;
  subscriptionTier: SubscriptionTier | null;
  isReadOnly: boolean;
  activeHandReceiptLimit: number | null;
};
