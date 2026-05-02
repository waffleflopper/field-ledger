import { and, asc, eq, sql } from "drizzle-orm";

import { handReceipts, items, requirements } from "@/db/schema";
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
    notes: row.notes,
    intervalType: row.intervalType as RequirementIntervalType,
    intervalValue: row.intervalValue,
    nextDueDate: row.nextDueDate,
    status: row.status as RequirementStatus,
    pausedAt: row.pausedAt,
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
    async findDashboardRequirements(accountId, options) {
      const rows = await run((transaction) =>
        transaction
          .select({
            requirementId: requirements.id,
            requirementName: requirements.name,
            nextDueDate: requirements.nextDueDate,
            itemId: items.id,
            itemNomenclature: items.nomenclature,
            handReceiptId: handReceipts.id,
            handReceiptName: handReceipts.name,
          })
          .from(requirements)
          .innerJoin(items, eq(requirements.itemId, items.id))
          .innerJoin(handReceipts, eq(items.handReceiptId, handReceipts.id))
          .where(
            and(
              eq(requirements.accountId, accountId),
              eq(requirements.status, "active"),
              sql`${requirements.pausedAt} is null`,
              sql`${requirements.nextDueDate} <= ${options.maxNextDueDate}`,
              eq(items.accountId, accountId),
              eq(items.status, "active"),
              eq(handReceipts.accountId, accountId),
              eq(handReceipts.status, "active"),
            ),
          )
          .orderBy(asc(requirements.nextDueDate), asc(requirements.name)),
      );

      return rows;
    },
    async update(accountId, requirementId, input) {
      const [updated] = await run((transaction) =>
        transaction
          .update(requirements)
          .set({
            name: input.name,
            notes: input.notes,
            intervalType: input.intervalType,
            intervalValue: input.intervalValue,
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
    async updateLifecycle(accountId, requirementId, input, options) {
      const pausedAtCondition =
        options && "expectedPausedAt" in options
          ? options.expectedPausedAt === null
            ? sql`${requirements.pausedAt} is null`
            : eq(requirements.pausedAt, options.expectedPausedAt)
          : undefined;

      const [updated] = await run((transaction) =>
        transaction
          .update(requirements)
          .set({
            ...("nextDueDate" in input
              ? { nextDueDate: input.nextDueDate }
              : {}),
            ...("pausedAt" in input ? { pausedAt: input.pausedAt } : {}),
            updatedAt: input.updatedAt,
          })
          .where(
            and(
              eq(requirements.accountId, accountId),
              eq(requirements.id, requirementId),
              pausedAtCondition,
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
