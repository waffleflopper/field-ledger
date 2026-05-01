import { and, eq, isNull, sql } from "drizzle-orm";

import { accounts } from "@/db/schema";
import type { AccountRepository } from "@/modules/accounts/application/ensure-account";
import type { AuthenticatedDatabaseTransaction } from "@/modules/provider-boundaries/database/authenticated-session";
import type { createDrizzleClient } from "@/modules/provider-boundaries/database/drizzle";

type DrizzleClient = ReturnType<typeof createDrizzleClient>;
type AccountExecutor = DrizzleClient | AuthenticatedDatabaseTransaction;

function createAccountRepository(db: AccountExecutor): AccountRepository {
  return {
    async findByUserId(userId) {
      const [account] = await db
        .select()
        .from(accounts)
        .where(eq(accounts.userId, userId))
        .limit(1);

      return account ?? null;
    },
    async create(account) {
      const [createdAccount] = await db
        .insert(accounts)
        .values(account)
        .onConflictDoNothing({ target: accounts.userId })
        .returning();

      return createdAccount ?? null;
    },
    async markOnboardingCompleted(accountId, completedAt) {
      const [updatedAccount] = await db
        .update(accounts)
        .set({
          onboardingCompletedAt: completedAt,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(accounts.id, accountId),
            isNull(accounts.onboardingCompletedAt),
          ),
        )
        .returning();

      if (updatedAccount) {
        return updatedAccount;
      }

      const [existingAccount] = await db
        .select()
        .from(accounts)
        .where(eq(accounts.id, accountId))
        .limit(1);

      return existingAccount ?? null;
    },
    async incrementAndGetNextItemSequence(accountId) {
      const [updatedAccount] = await db
        .update(accounts)
        .set({
          nextItemSequence: sql`${accounts.nextItemSequence} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(accounts.id, accountId))
        .returning({
          allocatedSequence: sql<number>`${accounts.nextItemSequence} - 1`,
        });

      if (!updatedAccount) {
        throw new Error("Unable to allocate generated item ID.");
      }

      return updatedAccount.allocatedSequence;
    },
  };
}

export function createDrizzleAccountRepository(
  db: DrizzleClient,
): AccountRepository {
  return createAccountRepository(db);
}

export function createTransactionalDrizzleAccountRepository(
  transaction: AuthenticatedDatabaseTransaction,
): AccountRepository {
  return createAccountRepository(transaction);
}
