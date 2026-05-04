import { deriveAccountCapabilities } from "@/modules/billing";
import { recordAuditEvent, type AuditRepository } from "@/modules/audit";

export type AccessState = "trialing" | "active" | "paused_read_only";
export type SubscriptionTier = "base" | "pro";

export type AccountRecord = {
  id: string;
  userId: string;
  accessState: AccessState;
  subscriptionTier: SubscriptionTier | null;
  trialStartsAt: Date;
  trialEndsAt: Date;
  onboardingCompletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export type MarkOnboardingCompletedResult = {
  account: AccountRecord;
  completedNow: boolean;
};

export type AccountRepository = {
  findByUserId(userId: string): Promise<AccountRecord | null>;
  create(account: AccountRecord): Promise<AccountRecord | null>;
  markOnboardingCompleted(
    accountId: string,
    completedAt: Date,
  ): Promise<MarkOnboardingCompletedResult | null>;
  incrementAndGetNextItemSequence(accountId: string): Promise<number>;
};

type EnsureAccountInput = {
  userId: string;
  repository: AccountRepository;
  now?: Date;
  createAccountId?: () => string;
};

const trialLengthDays = 30;
const millisecondsPerDay = 24 * 60 * 60 * 1000;

export async function ensureAccount({
  userId,
  repository,
  now = new Date(),
  createAccountId = () => globalThis.crypto.randomUUID(),
}: EnsureAccountInput) {
  const existingAccount = await repository.findByUserId(userId);

  if (existingAccount) {
    return existingAccount;
  }

  const trialStartsAt = new Date(now);
  const trialEndsAt = new Date(
    trialStartsAt.getTime() + trialLengthDays * millisecondsPerDay,
  );

  const createdAccount = await repository.create({
    id: createAccountId(),
    userId,
    accessState: "trialing",
    subscriptionTier: null,
    trialStartsAt,
    trialEndsAt,
  });

  if (createdAccount) {
    return createdAccount;
  }

  const concurrentlyCreatedAccount = await repository.findByUserId(userId);

  if (!concurrentlyCreatedAccount) {
    throw new Error("Unable to initialize owner account.");
  }

  return concurrentlyCreatedAccount;
}

type GetOnboardingStatusInput = {
  account: AccountRecord;
  now?: Date | undefined;
};

type CompleteOnboardingInput = {
  account: AccountRecord;
  repository: AccountRepository;
  auditRepository: AuditRepository;
  completedAt?: Date;
  now?: Date;
};

export function getOnboardingStatus({
  account,
  now = new Date(),
}: GetOnboardingStatusInput) {
  const capabilities = deriveAccountCapabilities(account, now);
  const completedAt = account.onboardingCompletedAt ?? null;

  return {
    completed: completedAt !== null,
    completedAt,
    accessState: capabilities.accessState,
    isReadOnly: capabilities.isReadOnly,
  };
}

export async function completeOnboarding({
  account,
  repository,
  auditRepository,
  completedAt = new Date(),
  now,
}: CompleteOnboardingInput) {
  if (account.onboardingCompletedAt) {
    return getOnboardingStatus({ account, now });
  }

  const completion = await repository.markOnboardingCompleted(
    account.id,
    completedAt,
  );

  if (!completion) {
    throw new Error("Unable to complete owner account onboarding.");
  }

  if (completion.completedNow) {
    await recordAuditEvent({
      accountId: account.id,
      actorId: account.userId,
      action: "account.onboarding_completed",
      target: {
        type: "account",
        id: account.id,
      },
      metadata: {
        acknowledgedBoundaryNotice: true,
      },
      occurredAt: completedAt,
      repository: auditRepository,
    });
  }

  return getOnboardingStatus({ account: completion.account, now });
}
