import { and, count, desc, eq } from "drizzle-orm";

import { auditEvents, handReceipts } from "@/db/schema";
import type { HandReceiptRepository } from "@/modules/hand-receipts";
import type {
  HandReceiptRecord,
  HandReceiptStatus,
} from "@/modules/hand-receipts/application/types";
import type { AuthenticatedDatabaseSession } from "@/modules/provider-boundaries/database/authenticated-session";
import { runWithAuthenticatedDatabaseSession } from "@/modules/provider-boundaries/database/authenticated-session";
import type { createDrizzleClient } from "@/modules/provider-boundaries/database/drizzle";

type DrizzleClient = ReturnType<typeof createDrizzleClient>;
type HandReceiptRow = typeof handReceipts.$inferSelect;

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

export function createDrizzleHandReceiptRepository(
  db: DrizzleClient,
  session: AuthenticatedDatabaseSession,
): HandReceiptRepository {
  return {
    async createWithAuditEvent(handReceipt, auditEvent) {
      const [createdHandReceipt] = await runWithAuthenticatedDatabaseSession(
        db,
        session,
        async (transaction) => {
          const [created] = await transaction
            .insert(handReceipts)
            .values(handReceipt)
            .returning();

          if (!created) {
            throw new Error("Hand receipt was not created.");
          }

          await transaction.insert(auditEvents).values(auditEvent);

          return [created];
        },
      );

      return toHandReceiptRecord(createdHandReceipt);
    },
    async findByAccountId(accountId, options = {}) {
      const filters = [eq(handReceipts.accountId, accountId)];

      if (options.status) {
        filters.push(eq(handReceipts.status, options.status));
      }

      const rows = await runWithAuthenticatedDatabaseSession(
        db,
        session,
        (transaction) =>
          transaction
            .select()
            .from(handReceipts)
            .where(and(...filters))
            .orderBy(desc(handReceipts.createdAt)),
      );

      return rows.map(toHandReceiptRecord);
    },
    async findById(accountId, handReceiptId) {
      const [row] = await runWithAuthenticatedDatabaseSession(
        db,
        session,
        (transaction) =>
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
    async updateWithAuditEvent(accountId, handReceiptId, updates, auditEvent) {
      const [updatedHandReceipt] = await runWithAuthenticatedDatabaseSession(
        db,
        session,
        async (transaction) => {
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

          await transaction.insert(auditEvents).values(auditEvent);

          return [updated];
        },
      );

      return updatedHandReceipt
        ? toHandReceiptRecord(updatedHandReceipt)
        : null;
    },
    async countActiveByAccountId(accountId) {
      const [row] = await runWithAuthenticatedDatabaseSession(
        db,
        session,
        (transaction) =>
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
