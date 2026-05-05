import type {
  AccessState,
  SubscriptionTier,
} from "@/modules/billing/application/types";

export type BillingStatusDisplayInput = {
  accessState: AccessState;
  subscriptionTier: SubscriptionTier | null;
  isReadOnly: boolean;
  activeHandReceiptLimit: number | null;
  trialEndsAt: Date;
};

export function getBillingStatusDisplay(
  status: BillingStatusDisplayInput,
  now = new Date(),
) {
  const planLabel = getPlanLabel(status);

  return {
    planLabel,
    stateLabel: getStateLabel(status),
    stateDescription: getStateDescription(status),
    accessWindowLabel: getAccessWindowLabel(status, now),
    handReceiptLimitLabel: getHandReceiptLimitLabel(status),
  };
}

function getPlanLabel(status: BillingStatusDisplayInput) {
  if (status.accessState === "trialing" && !status.subscriptionTier) {
    return "Trial access";
  }

  if (status.subscriptionTier === "base") {
    return "Base";
  }

  if (status.subscriptionTier === "pro") {
    return "Pro";
  }

  return "No active plan";
}

function getStateLabel(status: BillingStatusDisplayInput) {
  if (status.isReadOnly || status.accessState === "paused_read_only") {
    return "Read-only";
  }

  if (status.accessState === "trialing") {
    return "Trial active";
  }

  return "Active";
}

function getStateDescription(status: BillingStatusDisplayInput) {
  if (status.isReadOnly || status.accessState === "paused_read_only") {
    return "You can review existing records, documents, activity, and 2062 history. New accountable-record work waits until access is restored.";
  }

  if (status.accessState === "trialing") {
    return "Your trial has Pro-like access while it is active.";
  }

  return "Your account can continue normal property-accountability work.";
}

function getAccessWindowLabel(status: BillingStatusDisplayInput, now: Date) {
  if (status.accessState !== "trialing") {
    return "Plan-backed access";
  }

  if (status.trialEndsAt <= now || status.isReadOnly) {
    return `Trial ended ${formatDisplayDate(status.trialEndsAt)}`;
  }

  const daysRemaining = Math.max(
    1,
    Math.ceil(
      (status.trialEndsAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
    ),
  );

  return `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} left in trial`;
}

function getHandReceiptLimitLabel(status: BillingStatusDisplayInput) {
  if (status.activeHandReceiptLimit === null) {
    return "Unlimited active hand receipts";
  }

  if (status.activeHandReceiptLimit === 0) {
    return "New hand receipts unavailable in read-only mode";
  }

  return `${status.activeHandReceiptLimit} active hand receipts`;
}

export function formatDisplayDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
