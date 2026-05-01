import { and, asc, eq, sql } from "drizzle-orm";

import { requirements } from "@/db/schema";
import type { RequirementRepository } from "@/modules/requirements";
import type {
  RequirementIntervalType,
  RequirementRecord,
  RequirementStatus,
} from "@/modules/requirements";
import type {
  AuthenticatedDatabaseSession,
  AuthenticatedDatabaseTransaction,
} from "@/modules/provider-boundaries/database/authenticated-session";
import { runWithAuthenticatedDatabaseSession } from "@/modules/provider-boundaries/database/authenticated-session";
import type { createDrizzleClient } from "@/modules/provider-boundaries/database/drizzle";

type DrizzleClient = ReturnType<typeof createDrizzleClient>;
type RequirementRow = typeof requirements.$inferSelect;
type RequirementOperation = <T>(
  operation: (transaction: AuthenticatedDatabaseTransaction) => Promise<T>,
) => Promise<T>;

function toRequirementRecord(row: RequirementRow): RequirementRecord {
  return {
    id: row.id,
    accountId: row.accountId,
    itemId: row.itemId,
    name: row.name,
    intervalType: row.intervalType as RequirementIntervalType,
    intervalValue: row.intervalValue,
    nextDueDate: row.nextDueDate,
    status: row.status as RequirementStatus,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function createRequirementRepository(
  run: RequirementOperation,
): RequirementRepository {
  return {
    async create(requirement) {
      const createdRequirement = await run(async (transaction) => {
        const [created] = await transaction
          .insert(requirements)
          .values(requirement)
          .returning();

        if (!created) {
          throw new Error("Requirement was not created.");
        }

        return created;
      });

      return toRequirementRecord(createdRequirement);
    },
    async findById(accountId, requirementId) {
      const [row] = await run((transaction) =>
        transaction
          .select()
          .from(requirements)
          .where(
            and(
              eq(requirements.accountId, accountId),
              eq(requirements.id, requirementId),
            ),
          )
          .limit(1),
      );

      return row ? toRequirementRecord(row) : null;
    },
    async findByItemId(accountId, itemId) {
      const rows = await run((transaction) =>
        transaction
          .select()
          .from(requirements)
          .where(
            and(
              eq(requirements.accountId, accountId),
              eq(requirements.itemId, itemId),
              eq(requirements.status, "active"),
            ),
          )
          .orderBy(asc(requirements.nextDueDate), asc(requirements.name)),
      );

      return rows.map(toRequirementRecord);
    },
    async findByName(accountId, itemId, name) {
      const [row] = await run((transaction) =>
        transaction
          .select()
          .from(requirements)
          .where(
            and(
              eq(requirements.accountId, accountId),
              eq(requirements.itemId, itemId),
              eq(requirements.status, "active"),
              sql`lower(${requirements.name}) = ${name.trim().toLowerCase()}`,
            ),
          )
          .limit(1),
      );

      return row ? toRequirementRecord(row) : null;
    },
    async updateNextDueDate(accountId, requirementId, input) {
      const [updated] = await run((transaction) =>
        transaction
          .update(requirements)
          .set({
            nextDueDate: input.nextDueDate,
            updatedAt: input.updatedAt,
          })
          .where(
            and(
              eq(requirements.accountId, accountId),
              eq(requirements.id, requirementId),
            ),
          )
          .returning(),
      );

      return updated ? toRequirementRecord(updated) : null;
    },
  };
}

export function createDrizzleRequirementRepository(
  db: DrizzleClient,
  session: AuthenticatedDatabaseSession,
): RequirementRepository {
  return createRequirementRepository((operation) =>
    runWithAuthenticatedDatabaseSession(db, session, operation),
  );
}

export function createTransactionalDrizzleRequirementRepository(
  transaction: AuthenticatedDatabaseTransaction,
): RequirementRepository {
  return createRequirementRepository((operation) => operation(transaction));
}
