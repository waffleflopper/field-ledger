import { and, desc, eq } from "drizzle-orm";

import { documents } from "@/db/schema";
import type { DocumentRepository, DocumentRecord } from "@/modules/documents";
import type {
  AuthenticatedDatabaseSession,
  AuthenticatedDatabaseTransaction,
} from "@/modules/provider-boundaries/database/authenticated-session";
import { runWithAuthenticatedDatabaseSession } from "@/modules/provider-boundaries/database/authenticated-session";
import type { createDrizzleClient } from "@/modules/provider-boundaries/database/drizzle";

type DrizzleClient = ReturnType<typeof createDrizzleClient>;
type DocumentRow = typeof documents.$inferSelect;
type DocumentOperation = <T>(
  operation: (transaction: AuthenticatedDatabaseTransaction) => Promise<T>,
) => Promise<T>;

function toDocumentRecord(row: DocumentRow): DocumentRecord {
  return {
    id: row.id,
    accountId: row.accountId,
    handReceiptId: row.handReceiptId,
    filename: row.filename,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    storagePath: row.storagePath,
    uploadedAt: row.uploadedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function createDocumentRepository(run: DocumentOperation): DocumentRepository {
  return {
    async create(document) {
      const [createdDocument] = await run(async (transaction) => {
        const [created] = await transaction
          .insert(documents)
          .values(document)
          .returning();

        if (!created) {
          throw new Error("Document was not created.");
        }

        return [created];
      });

      return toDocumentRecord(createdDocument);
    },
    async findById(accountId, documentId) {
      const [row] = await run((transaction) =>
        transaction
          .select()
          .from(documents)
          .where(
            and(
              eq(documents.accountId, accountId),
              eq(documents.id, documentId),
            ),
          )
          .limit(1),
      );

      return row ? toDocumentRecord(row) : null;
    },
    async listByAccountId(accountId, options = {}) {
      const rows = await run((transaction) =>
        transaction
          .select()
          .from(documents)
          .where(
            options.handReceiptId
              ? and(
                  eq(documents.accountId, accountId),
                  eq(documents.handReceiptId, options.handReceiptId),
                )
              : eq(documents.accountId, accountId),
          )
          .orderBy(desc(documents.uploadedAt))
          .limit(options.limit ?? 50),
      );

      return rows.map(toDocumentRecord);
    },
  };
}

export function createDrizzleDocumentRepository(
  db: DrizzleClient,
  session: AuthenticatedDatabaseSession,
): DocumentRepository {
  return createDocumentRepository((operation) =>
    runWithAuthenticatedDatabaseSession(db, session, operation),
  );
}

export function createTransactionalDrizzleDocumentRepository(
  transaction: AuthenticatedDatabaseTransaction,
): DocumentRepository {
  return createDocumentRepository((operation) => operation(transaction));
}
