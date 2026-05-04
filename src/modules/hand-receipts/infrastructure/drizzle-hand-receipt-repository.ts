import { and, count, desc, eq, inArray } from "drizzle-orm";

import { handReceipts } from "@/db/schema";
import type { HandReceiptRepository } from "@/modules/hand-receipts";
import type {
  HandReceiptRecord,
  HandReceiptStatus,
} from "@/modules/hand-receipts/application/types";
import type { AuthenticatedDatabaseSession } from "@/modules/provider-boundaries/database/authenticated-session";
import type { AuthenticatedDatabaseTransaction } from "@/modules/provider-boundaries/database/authenticated-session";
import { runWithAuthenticatedDatabaseSession } from "@/modules/provider-boundaries/database/authenticated-session";
import type { createDrizzleClient } from "@/modules/provider-boundaries/database/drizzle";

type DrizzleClient = ReturnType<typeof createDrizzleClient>;
type HandReceiptRow = typeof handReceipts.$inferSelect;
type HandReceiptOperation = <T>(
  operation: (transaction: AuthenticatedDatabaseTransaction) => Promise<T>,
) => Promise<T>;

function toHandReceiptRecord(row: HandReceiptRow): HandReceiptRecord {
  return {
    id: row.id,
    accountId: row.accountId,
    name: row.name,
    notes: row.notes,
    handReceiptNumber: row.handReceiptNumber,
    holderName: row.holderName,
    unitName: row.unitName,
    uic: row.uic,
    effectiveDate: row.effectiveDate,
    status: row.status as HandReceiptStatus,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function createHandReceiptRepository(
  run: HandReceiptOperation,
): HandReceiptRepository {
  return {
    async create(handReceipt) {
      const [createdHandReceipt] = await run(async (transaction) => {
        const [created] = await transaction
          .insert(handReceipts)
          .values(handReceipt)
          .returning();

        if (!created) {
          throw new Error("Hand receipt was not created.");
        }

        return [created];
      });

      return toHandReceiptRecord(createdHandReceipt);
    },
    async findByAccountId(accountId, options = {}) {
      const filters = [eq(handReceipts.accountId, accountId)];

      if (options.status) {
        filters.push(eq(handReceipts.status, options.status));
      }

      const rows = await run((transaction) =>
        transaction
          .select()
          .from(handReceipts)
          .where(and(...filters))
          .orderBy(desc(handReceipts.createdAt)),
      );

      return rows.map(toHandReceiptRecord);
    },
    async findById(accountId, handReceiptId) {
      const [row] = await run((transaction) =>
        transaction
          .select()
          .from(handReceipts)
          .where(
            and(
              eq(handReceipts.accountId, accountId),
              eq(handReceipts.id, handReceiptId),
            ),
          )
          .limit(1),
      );

      return row ? toHandReceiptRecord(row) : null;
    },
    async findManyByIds(accountId, handReceiptIds) {
      if (handReceiptIds.length === 0) {
        return [];
      }

      const rows = await run((transaction) =>
        transaction
          .select()
          .from(handReceipts)
          .where(
            and(
              eq(handReceipts.accountId, accountId),
              inArray(handReceipts.id, handReceiptIds),
            ),
          ),
      );

      return rows.map(toHandReceiptRecord);
    },
    async update(accountId, handReceiptId, updates) {
      const [updatedHandReceipt] = await run(async (transaction) => {
        const [updated] = await transaction
          .update(handReceipts)
          .set(updates)
          .where(
            and(
              eq(handReceipts.accountId, accountId),
              eq(handReceipts.id, handReceiptId),
            ),
          )
          .returning();

        if (!updated) {
          return [null];
        }

        return [updated];
      });

      return updatedHandReceipt
        ? toHandReceiptRecord(updatedHandReceipt)
        : null;
    },
    async countActiveByAccountId(accountId) {
      const [row] = await run((transaction) =>
        transaction
          .select({ count: count() })
          .from(handReceipts)
          .where(
            and(
              eq(handReceipts.accountId, accountId),
              eq(handReceipts.status, "active"),
            ),
          ),
      );

      return row?.count ?? 0;
    },
  };
}

export function createDrizzleHandReceiptRepository(
  db: DrizzleClient,
  session: AuthenticatedDatabaseSession,
): HandReceiptRepository {
  return createHandReceiptRepository((operation) =>
    runWithAuthenticatedDatabaseSession(db, session, operation),
  );
}

export function createTransactionalDrizzleHandReceiptRepository(
  transaction: AuthenticatedDatabaseTransaction,
): HandReceiptRepository {
  return createHandReceiptRepository((operation) => operation(transaction));
}
