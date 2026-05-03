import { and, eq } from "drizzle-orm";

import { assignmentItemLinks } from "@/db/schema";
import type {
  AssignmentItemLinkRecord,
  AssignmentItemLinkRepository,
} from "@/modules/assignments-2062";
import type {
  AuthenticatedDatabaseSession,
  AuthenticatedDatabaseTransaction,
} from "@/modules/provider-boundaries/database/authenticated-session";
import { runWithAuthenticatedDatabaseSession } from "@/modules/provider-boundaries/database/authenticated-session";
import type { createDrizzleClient } from "@/modules/provider-boundaries/database/drizzle";

type DrizzleClient = ReturnType<typeof createDrizzleClient>;
type LinkOperation = <T>(
  operation: (transaction: AuthenticatedDatabaseTransaction) => Promise<T>,
) => Promise<T>;
type LinkRow = typeof assignmentItemLinks.$inferSelect;

function toLinkRecord(row: LinkRow): AssignmentItemLinkRecord {
  return {
    id: row.id,
    accountId: row.accountId,
    assignmentId: row.assignmentId,
    itemId: row.itemId,
    status: row.status,
    closedAt: row.closedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function createAssignmentItemLinkRepository(
  run: LinkOperation,
): AssignmentItemLinkRepository {
  return {
    async create(link) {
      const [created] = await run((transaction) =>
        transaction.insert(assignmentItemLinks).values(link).returning(),
      );

      if (!created) {
        throw new Error("Assignment item link was not created.");
      }

      return toLinkRecord(created);
    },
    async findById(accountId, linkId) {
      const [row] = await run((transaction) =>
        transaction
          .select()
          .from(assignmentItemLinks)
          .where(
            and(
              eq(assignmentItemLinks.accountId, accountId),
              eq(assignmentItemLinks.id, linkId),
            ),
          )
          .limit(1),
      );

      return row ? toLinkRecord(row) : null;
    },
    async findActiveByItemId(accountId, itemId) {
      const [row] = await run((transaction) =>
        transaction
          .select()
          .from(assignmentItemLinks)
          .where(
            and(
              eq(assignmentItemLinks.accountId, accountId),
              eq(assignmentItemLinks.itemId, itemId),
              eq(assignmentItemLinks.status, "active"),
            ),
          )
          .limit(1),
      );

      return row ? toLinkRecord(row) : null;
    },
    async findByAssignmentId(accountId, assignmentId, options = {}) {
      const filters = [
        eq(assignmentItemLinks.accountId, accountId),
        eq(assignmentItemLinks.assignmentId, assignmentId),
      ];

      if (options.status) {
        filters.push(eq(assignmentItemLinks.status, options.status));
      }

      const rows = await run((transaction) =>
        transaction
          .select()
          .from(assignmentItemLinks)
          .where(and(...filters)),
      );

      return rows.map(toLinkRecord);
    },
    async updateStatus(accountId, linkId, status, updatedAt, closedAt = null) {
      const [updated] = await run((transaction) =>
        transaction
          .update(assignmentItemLinks)
          .set({ status, updatedAt, closedAt })
          .where(
            and(
              eq(assignmentItemLinks.accountId, accountId),
              eq(assignmentItemLinks.id, linkId),
            ),
          )
          .returning(),
      );

      return updated ? toLinkRecord(updated) : null;
    },
  };
}

export function createDrizzleAssignmentItemLinkRepository(
  db: DrizzleClient,
  session: AuthenticatedDatabaseSession,
): AssignmentItemLinkRepository {
  return createAssignmentItemLinkRepository((operation) =>
    runWithAuthenticatedDatabaseSession(db, session, operation),
  );
}

export function createTransactionalDrizzleAssignmentItemLinkRepository(
  transaction: AuthenticatedDatabaseTransaction,
): AssignmentItemLinkRepository {
  return createAssignmentItemLinkRepository((operation) =>
    operation(transaction),
  );
}
