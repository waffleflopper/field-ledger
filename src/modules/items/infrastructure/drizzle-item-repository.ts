import { and, count, desc, eq, ilike, or } from "drizzle-orm";

import { contacts, handReceipts, items, locations } from "@/db/schema";
import type { ItemRepository } from "@/modules/items";
import type {
  ItemRecord,
  ItemSearchResult,
  SearchableItemField,
} from "@/modules/items/application/types";
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
  location: typeof locations.$inferSelect | null;
};
type ItemSearchRow = ItemRowWithContact & {
  handReceipt: typeof handReceipts.$inferSelect;
};
type ItemOperation = <T>(
  operation: (transaction: AuthenticatedDatabaseTransaction) => Promise<T>,
) => Promise<T>;

function toItemRecord(
  row: ItemRow,
  contactName: string | null = null,
  locationName: string | null = null,
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
    locationId: row.locationId,
    locationName,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toItemRecordFromJoinedRow(row: ItemRowWithContact): ItemRecord {
  return toItemRecord(
    row.item,
    row.contact?.displayName ?? null,
    row.location?.name ?? null,
  );
}

function valueMatches(value: string | null | undefined, query: string) {
  return value?.toLocaleLowerCase().includes(query) ?? false;
}

function toSearchResult(row: ItemSearchRow, query: string): ItemSearchResult {
  const item = toItemRecordFromJoinedRow(row);
  const matchedFields: SearchableItemField[] = [];

  if (valueMatches(item.ecn, query)) {
    matchedFields.push("ecn");
  }

  if (valueMatches(item.serialNumber, query)) {
    matchedFields.push("serialNumber");
  }

  if (valueMatches(item.generatedId, query)) {
    matchedFields.push("generatedId");
  }

  if (valueMatches(item.nomenclature, query)) {
    matchedFields.push("nomenclature");
  }

  if (valueMatches(row.handReceipt.name, query)) {
    matchedFields.push("handReceiptName");
  }

  if (valueMatches(row.contact?.displayName, query)) {
    matchedFields.push("contact");
  }

  if (valueMatches(row.location?.name, query)) {
    matchedFields.push("location");
  }

  return {
    item,
    handReceipt: {
      id: row.handReceipt.id,
      name: row.handReceipt.name,
      status: row.handReceipt.status,
    },
    contact: row.contact
      ? {
          id: row.contact.id,
          displayName: row.contact.displayName,
        }
      : null,
    location: row.location
      ? {
          id: row.location.id,
          name: row.location.name,
        }
      : null,
    matchedFields,
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
        .select({ item: items, contact: contacts, location: locations })
        .from(items)
        .leftJoin(contacts, eq(items.signedToContactId, contacts.id))
        .leftJoin(locations, eq(items.locationId, locations.id))
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
          .select({ item: items, contact: contacts, location: locations })
          .from(items)
          .leftJoin(contacts, eq(items.signedToContactId, contacts.id))
          .leftJoin(locations, eq(items.locationId, locations.id))
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
          .select({ item: items, contact: contacts, location: locations })
          .from(items)
          .leftJoin(contacts, eq(items.signedToContactId, contacts.id))
          .leftJoin(locations, eq(items.locationId, locations.id))
          .where(and(eq(items.accountId, accountId), eq(items.id, itemId)))
          .limit(1),
      );

      return row ? toItemRecordFromJoinedRow(row) : null;
    },
    async findByEcn(accountId, ecn) {
      const rows = await run((transaction) =>
        transaction
          .select({ item: items, contact: contacts, location: locations })
          .from(items)
          .leftJoin(contacts, eq(items.signedToContactId, contacts.id))
          .leftJoin(locations, eq(items.locationId, locations.id))
          .where(and(eq(items.accountId, accountId), eq(items.ecn, ecn)))
          .orderBy(desc(items.createdAt)),
      );

      return rows.map(toItemRecordFromJoinedRow);
    },
    async findBySerialNumber(accountId, serialNumber) {
      const rows = await run((transaction) =>
        transaction
          .select({ item: items, contact: contacts, location: locations })
          .from(items)
          .leftJoin(contacts, eq(items.signedToContactId, contacts.id))
          .leftJoin(locations, eq(items.locationId, locations.id))
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
    async search(accountId, input) {
      const trimmedQuery = input.query.trim();

      if (trimmedQuery.length === 0) {
        return [];
      }

      const pattern = `%${trimmedQuery}%`;
      const filters = [
        eq(items.accountId, accountId),
        eq(handReceipts.accountId, accountId),
        eq(handReceipts.status, "active" as const),
        or(
          ilike(items.ecn, pattern),
          ilike(items.serialNumber, pattern),
          ilike(items.generatedId, pattern),
          ilike(items.nomenclature, pattern),
          ilike(handReceipts.name, pattern),
          ilike(contacts.displayName, pattern),
          ilike(locations.name, pattern),
        ),
      ];

      if (!input.includeArchived) {
        filters.push(eq(items.status, "active"));
      }

      const rows = await run((transaction) =>
        transaction
          .select({
            item: items,
            handReceipt: handReceipts,
            contact: contacts,
            location: locations,
          })
          .from(items)
          .innerJoin(handReceipts, eq(items.handReceiptId, handReceipts.id))
          .leftJoin(contacts, eq(items.signedToContactId, contacts.id))
          .leftJoin(locations, eq(items.locationId, locations.id))
          .where(and(...filters))
          .orderBy(desc(items.updatedAt))
          .limit(50),
      );

      return rows.map((row) =>
        toSearchResult(row, trimmedQuery.toLocaleLowerCase()),
      );
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
