import type {
  AccountRecord,
  AccountRepository,
} from "@/modules/accounts/application/ensure-account";

export class InMemoryAccountRepository implements AccountRepository {
  private accounts = new Map<string, AccountRecord>();

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

    const updatedAccount = {
      ...account,
      onboardingCompletedAt: account.onboardingCompletedAt ?? completedAt,
    };

    this.accounts.set(account.userId, updatedAccount);
    return updatedAccount;
  }
}

export function createEmptyAccountRepository() {
  return new InMemoryAccountRepository();
}
