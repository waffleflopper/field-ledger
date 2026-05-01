import { and, desc, eq } from "drizzle-orm";

import { requirementCompletions } from "@/db/schema";
import type { RequirementCompletionRepository } from "@/modules/requirements";
import type { RequirementCompletionRecord } from "@/modules/requirements";
import type {
  AuthenticatedDatabaseSession,
  AuthenticatedDatabaseTransaction,
} from "@/modules/provider-boundaries/database/authenticated-session";
import { runWithAuthenticatedDatabaseSession } from "@/modules/provider-boundaries/database/authenticated-session";
import type { createDrizzleClient } from "@/modules/provider-boundaries/database/drizzle";

type DrizzleClient = ReturnType<typeof createDrizzleClient>;
type RequirementCompletionRow = typeof requirementCompletions.$inferSelect;
type RequirementCompletionOperation = <T>(
  operation: (transaction: AuthenticatedDatabaseTransaction) => Promise<T>,
) => Promise<T>;

function toRequirementCompletionRecord(
  row: RequirementCompletionRow,
): RequirementCompletionRecord {
  return {
    id: row.id,
    accountId: row.accountId,
    requirementId: row.requirementId,
    completedOn: row.completedOn,
    notes: row.notes,
    createdAt: row.createdAt,
  };
}

function createRequirementCompletionRepository(
  run: RequirementCompletionOperation,
): RequirementCompletionRepository {
  return {
    async create(completion) {
      const createdCompletion = await run(async (transaction) => {
        const [created] = await transaction
          .insert(requirementCompletions)
          .values(completion)
          .returning();

        if (!created) {
          throw new Error("Requirement completion was not created.");
        }

        return created;
      });

      return toRequirementCompletionRecord(createdCompletion);
    },
    async listByRequirementId(accountId, requirementId, options = {}) {
      const rows = await run((transaction) =>
        transaction
          .select()
          .from(requirementCompletions)
          .where(
            and(
              eq(requirementCompletions.accountId, accountId),
              eq(requirementCompletions.requirementId, requirementId),
            ),
          )
          .orderBy(
            desc(requirementCompletions.completedOn),
            desc(requirementCompletions.createdAt),
          )
          .limit(options.limit ?? 10),
      );

      return rows.map(toRequirementCompletionRecord);
    },
  };
}

export function createDrizzleRequirementCompletionRepository(
  db: DrizzleClient,
  session: AuthenticatedDatabaseSession,
): RequirementCompletionRepository {
  return createRequirementCompletionRepository((operation) =>
    runWithAuthenticatedDatabaseSession(db, session, operation),
  );
}

export function createTransactionalDrizzleRequirementCompletionRepository(
  transaction: AuthenticatedDatabaseTransaction,
): RequirementCompletionRepository {
  return createRequirementCompletionRepository((operation) =>
    operation(transaction),
  );
}
