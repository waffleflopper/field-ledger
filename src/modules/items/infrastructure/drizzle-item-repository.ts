import { and, count, desc, eq, or, sql, type SQLWrapper } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import {
  assignmentItemLinks,
  assignments,
  contacts,
  documents,
  handReceipts,
  items,
  locations,
} from "@/db/schema";
import {
  getMatchedItemSearchFields,
  normalizeItemSearchQuery,
} from "@/modules/items";
import type { ItemRepository } from "@/modules/items";
import type {
  ItemRecord,
  ItemSearchResult,
} from "@/modules/items/application/types";
import type {
  AuthenticatedDatabaseSession,
  AuthenticatedDatabaseTransaction,
} from "@/modules/provider-boundaries/database/authenticated-session";
import { runWithAuthenticatedDatabaseSession } from "@/modules/provider-boundaries/database/authenticated-session";
import type { createDrizzleClient } from "@/modules/provider-boundaries/database/drizzle";

type DrizzleClient = ReturnType<typeof createDrizzleClient>;
const signedToContacts = alias(contacts, "signed_to_contacts");
const active2062Contacts = alias(contacts, "active_2062_contacts");
type ItemRow = typeof items.$inferSelect;
type ItemRowWithContact = {
  item: ItemRow;
  contact: typeof signedToContacts.$inferSelect | null;
  location: typeof locations.$inferSelect | null;
  active2062Assignment: typeof assignments.$inferSelect | null;
  active2062Contact: typeof active2062Contacts.$inferSelect | null;
  active2062Document: typeof documents.$inferSelect | null;
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
  active2062Coverage: ItemRecord["active2062Coverage"] = null,
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
    active2062Coverage,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toItemRecordFromJoinedRow(row: ItemRowWithContact): ItemRecord {
  const active2062Coverage =
    row.active2062Assignment && row.active2062Contact && row.active2062Document
      ? {
          assignmentId: row.active2062Assignment.id,
          contactId: row.active2062Contact.id,
          contactName: row.active2062Contact.displayName,
          documentId: row.active2062Document.id,
          documentFilename: row.active2062Document.filename,
        }
      : null;

  return toItemRecord(
    row.item,
    row.contact?.displayName ?? null,
    row.location?.name ?? null,
    active2062Coverage,
  );
}

function toSearchResult(row: ItemSearchRow, query: string): ItemSearchResult {
  const item = toItemRecordFromJoinedRow(row);
  const matchedFields = getMatchedItemSearchFields(
    {
      ecn: item.ecn,
      serialNumber: item.serialNumber,
      generatedId: item.generatedId,
      nomenclature: item.nomenclature,
      handReceiptName: row.handReceipt.name,
      contact: row.contact?.displayName,
      location: row.location?.name,
    },
    query,
  );

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

function escapeLikePattern(value: string) {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}

function containsCaseInsensitive(column: SQLWrapper, query: string) {
  return sql`${column} ilike ${`%${escapeLikePattern(query)}%`} escape '\\'`;
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
        .select({
          item: items,
          contact: signedToContacts,
          location: locations,
          active2062Assignment: assignments,
          active2062Contact: active2062Contacts,
          active2062Document: documents,
        })
        .from(items)
        .leftJoin(
          signedToContacts,
          eq(items.signedToContactId, signedToContacts.id),
        )
        .leftJoin(locations, eq(items.locationId, locations.id))
        .leftJoin(
          assignmentItemLinks,
          and(
            eq(assignmentItemLinks.itemId, items.id),
            eq(assignmentItemLinks.accountId, items.accountId),
            eq(assignmentItemLinks.status, "active"),
          ),
        )
        .leftJoin(
          assignments,
          eq(assignmentItemLinks.assignmentId, assignments.id),
        )
        .leftJoin(
          active2062Contacts,
          eq(assignments.contactId, active2062Contacts.id),
        )
        .leftJoin(documents, eq(assignments.documentId, documents.id))
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
          .select({
            item: items,
            contact: signedToContacts,
            location: locations,
            active2062Assignment: assignments,
            active2062Contact: active2062Contacts,
            active2062Document: documents,
          })
          .from(items)
          .leftJoin(
            signedToContacts,
            eq(items.signedToContactId, signedToContacts.id),
          )
          .leftJoin(locations, eq(items.locationId, locations.id))
          .leftJoin(
            assignmentItemLinks,
            and(
              eq(assignmentItemLinks.itemId, items.id),
              eq(assignmentItemLinks.accountId, items.accountId),
              eq(assignmentItemLinks.status, "active"),
            ),
          )
          .leftJoin(
            assignments,
            eq(assignmentItemLinks.assignmentId, assignments.id),
          )
          .leftJoin(
            active2062Contacts,
            eq(assignments.contactId, active2062Contacts.id),
          )
          .leftJoin(documents, eq(assignments.documentId, documents.id))
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
          .select({
            item: items,
            contact: signedToContacts,
            location: locations,
            active2062Assignment: assignments,
            active2062Contact: active2062Contacts,
            active2062Document: documents,
          })
          .from(items)
          .leftJoin(
            signedToContacts,
            eq(items.signedToContactId, signedToContacts.id),
          )
          .leftJoin(locations, eq(items.locationId, locations.id))
          .leftJoin(
            assignmentItemLinks,
            and(
              eq(assignmentItemLinks.itemId, items.id),
              eq(assignmentItemLinks.accountId, items.accountId),
              eq(assignmentItemLinks.status, "active"),
            ),
          )
          .leftJoin(
            assignments,
            eq(assignmentItemLinks.assignmentId, assignments.id),
          )
          .leftJoin(
            active2062Contacts,
            eq(assignments.contactId, active2062Contacts.id),
          )
          .leftJoin(documents, eq(assignments.documentId, documents.id))
          .where(and(eq(items.accountId, accountId), eq(items.id, itemId)))
          .limit(1),
      );

      return row ? toItemRecordFromJoinedRow(row) : null;
    },
    async findByEcn(accountId, ecn) {
      const rows = await run((transaction) =>
        transaction
          .select({
            item: items,
            contact: signedToContacts,
            location: locations,
            active2062Assignment: assignments,
            active2062Contact: active2062Contacts,
            active2062Document: documents,
          })
          .from(items)
          .leftJoin(
            signedToContacts,
            eq(items.signedToContactId, signedToContacts.id),
          )
          .leftJoin(locations, eq(items.locationId, locations.id))
          .leftJoin(
            assignmentItemLinks,
            and(
              eq(assignmentItemLinks.itemId, items.id),
              eq(assignmentItemLinks.accountId, items.accountId),
              eq(assignmentItemLinks.status, "active"),
            ),
          )
          .leftJoin(
            assignments,
            eq(assignmentItemLinks.assignmentId, assignments.id),
          )
          .leftJoin(
            active2062Contacts,
            eq(assignments.contactId, active2062Contacts.id),
          )
          .leftJoin(documents, eq(assignments.documentId, documents.id))
          .where(and(eq(items.accountId, accountId), eq(items.ecn, ecn)))
          .orderBy(desc(items.createdAt)),
      );

      return rows.map(toItemRecordFromJoinedRow);
    },
    async findBySerialNumber(accountId, serialNumber) {
      const rows = await run((transaction) =>
        transaction
          .select({
            item: items,
            contact: signedToContacts,
            location: locations,
            active2062Assignment: assignments,
            active2062Contact: active2062Contacts,
            active2062Document: documents,
          })
          .from(items)
          .leftJoin(
            signedToContacts,
            eq(items.signedToContactId, signedToContacts.id),
          )
          .leftJoin(locations, eq(items.locationId, locations.id))
          .leftJoin(
            assignmentItemLinks,
            and(
              eq(assignmentItemLinks.itemId, items.id),
              eq(assignmentItemLinks.accountId, items.accountId),
              eq(assignmentItemLinks.status, "active"),
            ),
          )
          .leftJoin(
            assignments,
            eq(assignmentItemLinks.assignmentId, assignments.id),
          )
          .leftJoin(
            active2062Contacts,
            eq(assignments.contactId, active2062Contacts.id),
          )
          .leftJoin(documents, eq(assignments.documentId, documents.id))
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

      const filters = [
        eq(items.accountId, accountId),
        eq(handReceipts.accountId, accountId),
        or(
          containsCaseInsensitive(items.ecn, trimmedQuery),
          containsCaseInsensitive(items.serialNumber, trimmedQuery),
          containsCaseInsensitive(items.generatedId, trimmedQuery),
          containsCaseInsensitive(items.nomenclature, trimmedQuery),
          containsCaseInsensitive(handReceipts.name, trimmedQuery),
          containsCaseInsensitive(signedToContacts.displayName, trimmedQuery),
          containsCaseInsensitive(locations.name, trimmedQuery),
        ),
      ];

      if (!input.includeArchived) {
        filters.push(eq(items.status, "active"));
        filters.push(eq(handReceipts.status, "active"));
      }

      const rows = await run((transaction) =>
        transaction
          .select({
            item: items,
            handReceipt: handReceipts,
            contact: signedToContacts,
            location: locations,
            active2062Assignment: assignments,
            active2062Contact: active2062Contacts,
            active2062Document: documents,
          })
          .from(items)
          .innerJoin(handReceipts, eq(items.handReceiptId, handReceipts.id))
          .leftJoin(
            signedToContacts,
            eq(items.signedToContactId, signedToContacts.id),
          )
          .leftJoin(locations, eq(items.locationId, locations.id))
          .leftJoin(
            assignmentItemLinks,
            and(
              eq(assignmentItemLinks.itemId, items.id),
              eq(assignmentItemLinks.accountId, items.accountId),
              eq(assignmentItemLinks.status, "active"),
            ),
          )
          .leftJoin(
            assignments,
            eq(assignmentItemLinks.assignmentId, assignments.id),
          )
          .leftJoin(
            active2062Contacts,
            eq(assignments.contactId, active2062Contacts.id),
          )
          .leftJoin(documents, eq(assignments.documentId, documents.id))
          .where(and(...filters))
          .orderBy(desc(items.updatedAt))
          .limit(50),
      );

      return rows.map((row) =>
        toSearchResult(row, normalizeItemSearchQuery(trimmedQuery)),
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
