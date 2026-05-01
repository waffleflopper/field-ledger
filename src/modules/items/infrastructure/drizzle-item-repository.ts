import { and, count, desc, eq } from "drizzle-orm";

import { items } from "@/db/schema";
import type { ItemRepository } from "@/modules/items";
import type { ItemRecord } from "@/modules/items/application/types";
import type {
  AuthenticatedDatabaseSession,
  AuthenticatedDatabaseTransaction,
} from "@/modules/provider-boundaries/database/authenticated-session";
import { runWithAuthenticatedDatabaseSession } from "@/modules/provider-boundaries/database/authenticated-session";
import type { createDrizzleClient } from "@/modules/provider-boundaries/database/drizzle";

type DrizzleClient = ReturnType<typeof createDrizzleClient>;
type ItemRow = typeof items.$inferSelect;
type ItemOperation = <T>(
  operation: (transaction: AuthenticatedDatabaseTransaction) => Promise<T>,
) => Promise<T>;

function toItemRecord(row: ItemRow): ItemRecord {
  return {
    id: row.id,
    accountId: row.accountId,
    handReceiptId: row.handReceiptId,
    nomenclature: row.nomenclature,
    ecn: row.ecn,
    serialNumber: row.serialNumber,
    generatedId: row.generatedId,
    notes: row.notes,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function createItemRepository(run: ItemOperation): ItemRepository {
  const findByAccountId: ItemRepository["findByAccountId"] = async (
    accountId,
    options = {},
  ) => {
    const filters = [eq(items.accountId, accountId)];

    if (options.status) {
      filters.push(eq(items.status, options.status));
    }

    if (options.handReceiptId) {
      filters.push(eq(items.handReceiptId, options.handReceiptId));
    }

    const rows = await run((transaction) =>
      transaction
        .select()
        .from(items)
        .where(and(...filters))
        .orderBy(desc(items.createdAt)),
    );

    return rows.map(toItemRecord);
  };

  return {
    async create(item) {
      const createdItem = await run(async (transaction) => {
        const [created] = await transaction
          .insert(items)
          .values(item)
          .returning();

        if (!created) {
          throw new Error("Item was not created.");
        }

        return created;
      });

      return toItemRecord(createdItem);
    },
    findByAccountId,
    async findById(accountId, itemId) {
      const [row] = await run((transaction) =>
        transaction
          .select()
          .from(items)
          .where(and(eq(items.accountId, accountId), eq(items.id, itemId)))
          .limit(1),
      );

      return row ? toItemRecord(row) : null;
    },
    async findByHandReceiptId(accountId, handReceiptId, options = {}) {
      return findByAccountId(accountId, {
        handReceiptId,
        ...(options.status ? { status: options.status } : {}),
      });
    },
    async update(accountId, itemId, updates) {
      const updatedItem = await run(async (transaction) => {
        const [updated] = await transaction
          .update(items)
          .set(updates)
          .where(and(eq(items.accountId, accountId), eq(items.id, itemId)))
          .returning();

        return updated ?? null;
      });

      return updatedItem ? toItemRecord(updatedItem) : null;
    },
    async findByEcn(accountId, ecn) {
      const rows = await run((transaction) =>
        transaction
          .select()
          .from(items)
          .where(and(eq(items.accountId, accountId), eq(items.ecn, ecn)))
          .orderBy(desc(items.createdAt)),
      );

      return rows.map(toItemRecord);
    },
    async findBySerialNumber(accountId, serialNumber) {
      const rows = await run((transaction) =>
        transaction
          .select()
          .from(items)
          .where(
            and(
              eq(items.accountId, accountId),
              eq(items.serialNumber, serialNumber),
            ),
          )
          .orderBy(desc(items.createdAt)),
      );

      return rows.map(toItemRecord);
    },
    async countActiveByAccountId(accountId) {
      const [row] = await run((transaction) =>
        transaction
          .select({ count: count() })
          .from(items)
          .where(
            and(eq(items.accountId, accountId), eq(items.status, "active")),
          ),
      );

      return row?.count ?? 0;
    },
    async countActiveByHandReceiptId(accountId, handReceiptId) {
      const [row] = await run((transaction) =>
        transaction
          .select({ count: count() })
          .from(items)
          .where(
            and(
              eq(items.accountId, accountId),
              eq(items.handReceiptId, handReceiptId),
              eq(items.status, "active"),
            ),
          ),
      );

      return row?.count ?? 0;
    },
  };
}

export function createDrizzleItemRepository(
  db: DrizzleClient,
  session: AuthenticatedDatabaseSession,
): ItemRepository {
  return createItemRepository((operation) =>
    runWithAuthenticatedDatabaseSession(db, session, operation),
  );
}

export function createTransactionalDrizzleItemRepository(
  transaction: AuthenticatedDatabaseTransaction,
): ItemRepository {
  return createItemRepository((operation) => operation(transaction));
}
