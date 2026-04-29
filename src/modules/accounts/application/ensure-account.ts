export type AccessState = "trialing" | "active" | "paused_read_only";

export type AccountRecord = {
  id: string;
  accessState: AccessState;
  trialStartsAt: Date;
  trialEndsAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
};

export type AccountRepository = {
  findById(accountId: string): Promise<AccountRecord | null>;
  create(account: AccountRecord): Promise<AccountRecord | null>;
};

type EnsureAccountInput = {
  userId: string;
  repository: AccountRepository;
  now?: Date;
};

const trialLengthDays = 30;
const millisecondsPerDay = 24 * 60 * 60 * 1000;

export async function ensureAccount({
  userId,
  repository,
  now = new Date(),
}: EnsureAccountInput) {
  const existingAccount = await repository.findById(userId);

  if (existingAccount) {
    return existingAccount;
  }

  const trialStartsAt = new Date(now);
  const trialEndsAt = new Date(
    trialStartsAt.getTime() + trialLengthDays * millisecondsPerDay,
  );

  const createdAccount = await repository.create({
    id: userId,
    accessState: "trialing",
    trialStartsAt,
    trialEndsAt,
  });

  if (createdAccount) {
    return createdAccount;
  }

  const concurrentlyCreatedAccount = await repository.findById(userId);

  if (!concurrentlyCreatedAccount) {
    throw new Error("Unable to initialize owner account.");
  }

  return concurrentlyCreatedAccount;
}
