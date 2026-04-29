import type {
  AccountRecord,
  AccountRepository,
} from "@/modules/accounts/application/ensure-account";

export class InMemoryAccountRepository implements AccountRepository {
  private accounts = new Map<string, AccountRecord>();

  constructor(accounts: AccountRecord[] = []) {
    for (const account of accounts) {
      this.accounts.set(account.id, account);
    }
  }

  async findById(accountId: string) {
    return this.accounts.get(accountId) ?? null;
  }

  async create(account: AccountRecord) {
    if (this.accounts.has(account.id)) {
      return this.accounts.get(account.id) ?? null;
    }

    this.accounts.set(account.id, account);
    return account;
  }

  async markOnboardingCompleted(accountId: string, completedAt: Date) {
    const account = this.accounts.get(accountId);

    if (!account) {
      return null;
    }

    const updatedAccount = {
      ...account,
      onboardingCompletedAt: account.onboardingCompletedAt ?? completedAt,
    };

    this.accounts.set(accountId, updatedAccount);
    return updatedAccount;
  }
}

export function createEmptyAccountRepository() {
  return new InMemoryAccountRepository();
}
