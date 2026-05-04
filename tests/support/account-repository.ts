import type {
  AccountRecord,
  AccountRepository,
} from "@/modules/accounts/application/ensure-account";

export class InMemoryAccountRepository implements AccountRepository {
  private accounts = new Map<string, AccountRecord>();
  private itemSequences = new Map<string, number>();

  constructor(accounts: AccountRecord[] = []) {
    for (const account of accounts) {
      this.accounts.set(account.userId, account);
    }
  }

  async findByUserId(userId: string) {
    return this.accounts.get(userId) ?? null;
  }

  async create(account: AccountRecord) {
    if (this.accounts.has(account.userId)) {
      return this.accounts.get(account.userId) ?? null;
    }

    this.accounts.set(account.userId, account);
    return account;
  }

  async markOnboardingCompleted(accountId: string, completedAt: Date) {
    const account = Array.from(this.accounts.values()).find(
      (candidate) => candidate.id === accountId,
    );

    if (!account) {
      return null;
    }

    const completedNow = !account.onboardingCompletedAt;
    const updatedAccount = {
      ...account,
      onboardingCompletedAt: account.onboardingCompletedAt ?? completedAt,
    };

    this.accounts.set(account.userId, updatedAccount);
    return {
      account: updatedAccount,
      completedNow,
    };
  }

  async incrementAndGetNextItemSequence(accountId: string) {
    const account = Array.from(this.accounts.values()).find(
      (candidate) => candidate.id === accountId,
    );

    if (!account) {
      throw new Error("Unable to allocate generated item ID.");
    }

    const currentSequence = this.itemSequences.get(accountId) ?? 1;

    this.itemSequences.set(accountId, currentSequence + 1);
    return currentSequence;
  }

  snapshotState() {
    return {
      accounts: new Map(this.accounts),
      itemSequences: new Map(this.itemSequences),
    };
  }

  restoreState(
    snapshot: ReturnType<InMemoryAccountRepository["snapshotState"]>,
  ) {
    this.accounts = new Map(snapshot.accounts);
    this.itemSequences = new Map(snapshot.itemSequences);
  }
}

export function createEmptyAccountRepository() {
  return new InMemoryAccountRepository();
}
