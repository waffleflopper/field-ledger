import { and, desc, eq } from "drizzle-orm";

import { assignments, contacts, documents } from "@/db/schema";
import type {
  AssignmentRecord,
  AssignmentRepository,
} from "@/modules/assignments-2062";
import type {
  AuthenticatedDatabaseSession,
  AuthenticatedDatabaseTransaction,
} from "@/modules/provider-boundaries/database/authenticated-session";
import { runWithAuthenticatedDatabaseSession } from "@/modules/provider-boundaries/database/authenticated-session";
import type { createDrizzleClient } from "@/modules/provider-boundaries/database/drizzle";

type DrizzleClient = ReturnType<typeof createDrizzleClient>;
type AssignmentOperation = <T>(
  operation: (transaction: AuthenticatedDatabaseTransaction) => Promise<T>,
) => Promise<T>;
type AssignmentRow = typeof assignments.$inferSelect;

function toAssignmentRecord(
  row: AssignmentRow,
  contactName: string | null = null,
  documentFilename: string | null = null,
): AssignmentRecord {
  return {
    id: row.id,
    accountId: row.accountId,
    handReceiptId: row.handReceiptId,
    contactId: row.contactId,
    contactName,
    documentId: row.documentId,
    documentFilename,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function createAssignmentRepository(
  run: AssignmentOperation,
): AssignmentRepository {
  async function list(
    accountId: string,
    filters: { status?: "active" | "closed"; handReceiptId?: string } = {},
  ) {
    const where = [eq(assignments.accountId, accountId)];

    if (filters.status) {
      where.push(eq(assignments.status, filters.status));
    }

    if (filters.handReceiptId) {
      where.push(eq(assignments.handReceiptId, filters.handReceiptId));
    }

    const rows = await run((transaction) =>
      transaction
        .select({
          assignment: assignments,
          contact: contacts,
          document: documents,
        })
        .from(assignments)
        .innerJoin(contacts, eq(assignments.contactId, contacts.id))
        .innerJoin(documents, eq(assignments.documentId, documents.id))
        .where(and(...where))
        .orderBy(desc(assignments.createdAt)),
    );

    return rows.map((row) =>
      toAssignmentRecord(
        row.assignment,
        row.contact.displayName,
        row.document.filename,
      ),
    );
  }

  return {
    async create(assignment) {
      const [created] = await run((transaction) =>
        transaction.insert(assignments).values(assignment).returning(),
      );

      if (!created) {
        throw new Error("Assignment was not created.");
      }

      return toAssignmentRecord(created);
    },
    async findById(accountId, assignmentId) {
      const [row] = await run((transaction) =>
        transaction
          .select({
            assignment: assignments,
            contact: contacts,
            document: documents,
          })
          .from(assignments)
          .innerJoin(contacts, eq(assignments.contactId, contacts.id))
          .innerJoin(documents, eq(assignments.documentId, documents.id))
          .where(
            and(
              eq(assignments.accountId, accountId),
              eq(assignments.id, assignmentId),
            ),
          )
          .limit(1),
      );

      return row
        ? toAssignmentRecord(
            row.assignment,
            row.contact.displayName,
            row.document.filename,
          )
        : null;
    },
    findByAccountId(accountId, options = {}) {
      return list(accountId, options);
    },
    findByHandReceiptId(accountId, handReceiptId, options = {}) {
      return list(accountId, { ...options, handReceiptId });
    },
    async updateStatus(accountId, assignmentId, status, updatedAt) {
      const [updated] = await run((transaction) =>
        transaction
          .update(assignments)
          .set({ status, updatedAt })
          .where(
            and(
              eq(assignments.accountId, accountId),
              eq(assignments.id, assignmentId),
            ),
          )
          .returning(),
      );

      return updated ? toAssignmentRecord(updated) : null;
    },
  };
}

export function createDrizzleAssignmentRepository(
  db: DrizzleClient,
  session: AuthenticatedDatabaseSession,
): AssignmentRepository {
  return createAssignmentRepository((operation) =>
    runWithAuthenticatedDatabaseSession(db, session, operation),
  );
}

export function createTransactionalDrizzleAssignmentRepository(
  transaction: AuthenticatedDatabaseTransaction,
): AssignmentRepository {
  return createAssignmentRepository((operation) => operation(transaction));
}
