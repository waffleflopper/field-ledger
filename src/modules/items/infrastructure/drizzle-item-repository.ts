import { and, count, desc, eq } from "drizzle-orm";

import { contacts, items } from "@/db/schema";
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
type ItemRowWithContact = {
  item: ItemRow;
  contact: typeof contacts.$inferSelect | null;
};
type ItemOperation = <T>(
  operation: (transaction: AuthenticatedDatabaseTransaction) => Promise<T>,
) => Promise<T>;

function toItemRecord(
  row: ItemRow,
  contactName: string | null = null,
): ItemRecord {
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
    signedToContactId: row.signedToContactId,
    signedToContactName: contactName,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toItemRecordFromJoinedRow(row: ItemRowWithContact): ItemRecord {
  return toItemRecord(row.item, row.contact?.displayName ?? null);
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
        .select({ item: items, contact: contacts })
        .from(items)
        .leftJoin(contacts, eq(items.signedToContactId, contacts.id))
        .where(and(...filters))
        .orderBy(desc(items.createdAt)),
    );

    return rows.map(toItemRecordFromJoinedRow);
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
          .select({ item: items, contact: contacts })
          .from(items)
          .leftJoin(contacts, eq(items.signedToContactId, contacts.id))
          .where(and(eq(items.accountId, accountId), eq(items.id, itemId)))
          .limit(1),
      );

      return row ? toItemRecordFromJoinedRow(row) : null;
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

      if (!updatedItem) {
        return null;
      }

      const [row] = await run((transaction) =>
        transaction
          .select({ item: items, contact: contacts })
          .from(items)
          .leftJoin(contacts, eq(items.signedToContactId, contacts.id))
          .where(and(eq(items.accountId, accountId), eq(items.id, itemId)))
          .limit(1),
      );

      return row ? toItemRecordFromJoinedRow(row) : null;
    },
    async findByEcn(accountId, ecn) {
      const rows = await run((transaction) =>
        transaction
          .select({ item: items, contact: contacts })
          .from(items)
          .leftJoin(contacts, eq(items.signedToContactId, contacts.id))
          .where(and(eq(items.accountId, accountId), eq(items.ecn, ecn)))
          .orderBy(desc(items.createdAt)),
      );

      return rows.map(toItemRecordFromJoinedRow);
    },
    async findBySerialNumber(accountId, serialNumber) {
      const rows = await run((transaction) =>
        transaction
          .select({ item: items, contact: contacts })
          .from(items)
          .leftJoin(contacts, eq(items.signedToContactId, contacts.id))
          .where(
            and(
              eq(items.accountId, accountId),
              eq(items.serialNumber, serialNumber),
            ),
          )
          .orderBy(desc(items.createdAt)),
      );

      return rows.map(toItemRecordFromJoinedRow);
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
