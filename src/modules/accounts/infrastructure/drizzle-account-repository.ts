import { and, eq, isNull } from "drizzle-orm";

import { accounts } from "@/db/schema";
import type { AccountRepository } from "@/modules/accounts/application/ensure-account";
import type { createDrizzleClient } from "@/modules/provider-boundaries/database/drizzle";

type DrizzleClient = ReturnType<typeof createDrizzleClient>;

export function createDrizzleAccountRepository(
  db: DrizzleClient,
): AccountRepository {
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
  };
}
