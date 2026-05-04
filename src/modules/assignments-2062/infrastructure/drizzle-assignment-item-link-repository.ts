import { and, desc, eq, sql } from "drizzle-orm";

import {
  assignmentItemLinks,
  assignments,
  contacts,
  documents,
  handReceipts,
} from "@/db/schema";
import type {
  AssignmentItemLinkRecord,
  AssignmentItemLinkRepository,
  CoverageHistoryEntry,
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

function toCoverageHistoryEntry(row: {
  link: LinkRow;
  assignment: typeof assignments.$inferSelect;
  contact: typeof contacts.$inferSelect;
  document: typeof documents.$inferSelect;
  handReceipt: typeof handReceipts.$inferSelect;
}): CoverageHistoryEntry {
  return {
    linkId: row.link.id,
    assignmentId: row.link.assignmentId,
    itemId: row.link.itemId,
    status: row.link.status,
    closedAt: row.link.closedAt,
    createdAt: row.link.createdAt,
    updatedAt: row.link.updatedAt,
    handReceiptId: row.assignment.handReceiptId,
    handReceiptName: row.handReceipt.name,
    contactId: row.assignment.contactId,
    contactName: row.contact.displayName,
    documentId: row.assignment.documentId,
    documentFilename: row.document.filename,
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
    async findByItemId(accountId, itemId, options = {}) {
      const filters = [
        eq(assignmentItemLinks.accountId, accountId),
        eq(assignmentItemLinks.itemId, itemId),
      ];

      if (options.status) {
        filters.push(eq(assignmentItemLinks.status, options.status));
      }

      const rows = await run((transaction) =>
        transaction
          .select()
          .from(assignmentItemLinks)
          .where(and(...filters))
          .orderBy(
            desc(assignmentItemLinks.closedAt),
            desc(assignmentItemLinks.updatedAt),
            desc(assignmentItemLinks.createdAt),
          ),
      );

      return rows.map(toLinkRecord);
    },
    async findByItemIdWithAssignment(accountId, itemId, options = {}) {
      const filters = [
        eq(assignmentItemLinks.accountId, accountId),
        eq(assignmentItemLinks.itemId, itemId),
      ];

      if (options.status) {
        filters.push(eq(assignmentItemLinks.status, options.status));
      }

      const rows = await run((transaction) =>
        transaction
          .select({
            link: assignmentItemLinks,
            assignment: assignments,
            contact: contacts,
            document: documents,
            handReceipt: handReceipts,
          })
          .from(assignmentItemLinks)
          .innerJoin(
            assignments,
            eq(assignmentItemLinks.assignmentId, assignments.id),
          )
          .innerJoin(contacts, eq(assignments.contactId, contacts.id))
          .innerJoin(documents, eq(assignments.documentId, documents.id))
          .innerJoin(
            handReceipts,
            eq(assignments.handReceiptId, handReceipts.id),
          )
          .where(and(...filters))
          .orderBy(
            sql`case when ${assignmentItemLinks.status} = 'active' then 0 else 1 end`,
            desc(assignmentItemLinks.closedAt),
            desc(assignmentItemLinks.updatedAt),
            desc(assignmentItemLinks.createdAt),
          ),
      );

      return rows.map(toCoverageHistoryEntry);
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
