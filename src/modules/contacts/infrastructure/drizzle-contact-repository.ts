import { and, asc, eq, ilike, isNull } from "drizzle-orm";

import { contacts } from "@/db/schema";
import type { ContactRepository } from "@/modules/contacts";
import type { ContactRecord } from "@/modules/contacts/application/types";
import type {
  AuthenticatedDatabaseSession,
  AuthenticatedDatabaseTransaction,
} from "@/modules/provider-boundaries/database/authenticated-session";
import { runWithAuthenticatedDatabaseSession } from "@/modules/provider-boundaries/database/authenticated-session";
import type { createDrizzleClient } from "@/modules/provider-boundaries/database/drizzle";

type DrizzleClient = ReturnType<typeof createDrizzleClient>;
type ContactRow = typeof contacts.$inferSelect;
type ContactOperation = <T>(
  operation: (transaction: AuthenticatedDatabaseTransaction) => Promise<T>,
) => Promise<T>;

function toContactRecord(row: ContactRow): ContactRecord {
  return {
    id: row.id,
    accountId: row.accountId,
    displayName: row.displayName,
    archivedAt: row.archivedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function createContactRepository(run: ContactOperation): ContactRepository {
  return {
    async create(contact) {
      const createdContact = await run(async (transaction) => {
        const [created] = await transaction
          .insert(contacts)
          .values(contact)
          .returning();

        if (!created) {
          throw new Error("Contact was not created.");
        }

        return created;
      });

      return toContactRecord(createdContact);
    },
    async findByAccountId(accountId) {
      const rows = await run((transaction) =>
        transaction
          .select()
          .from(contacts)
          .where(
            and(eq(contacts.accountId, accountId), isNull(contacts.archivedAt)),
          )
          .orderBy(asc(contacts.displayName)),
      );

      return rows.map(toContactRecord);
    },
    async findById(accountId, contactId) {
      const [row] = await run((transaction) =>
        transaction
          .select()
          .from(contacts)
          .where(
            and(eq(contacts.accountId, accountId), eq(contacts.id, contactId)),
          )
          .limit(1),
      );

      return row ? toContactRecord(row) : null;
    },
    async searchByName(accountId, query) {
      const trimmed = query.trim();
      const rows = await run((transaction) =>
        transaction
          .select()
          .from(contacts)
          .where(
            trimmed
              ? and(
                  eq(contacts.accountId, accountId),
                  isNull(contacts.archivedAt),
                  ilike(contacts.displayName, `${trimmed}%`),
                )
              : and(
                  eq(contacts.accountId, accountId),
                  isNull(contacts.archivedAt),
                ),
          )
          .orderBy(asc(contacts.displayName))
          .limit(10),
      );

      return rows.map(toContactRecord);
    },
    async update(accountId, contactId, values) {
      const [row] = await run((transaction) =>
        transaction
          .update(contacts)
          .set(values)
          .where(
            and(eq(contacts.accountId, accountId), eq(contacts.id, contactId)),
          )
          .returning(),
      );

      return row ? toContactRecord(row) : null;
    },
  };
}

export function createDrizzleContactRepository(
  db: DrizzleClient,
  session: AuthenticatedDatabaseSession,
): ContactRepository {
  return createContactRepository((operation) =>
    runWithAuthenticatedDatabaseSession(db, session, operation),
  );
}

export function createTransactionalDrizzleContactRepository(
  transaction: AuthenticatedDatabaseTransaction,
): ContactRepository {
  return createContactRepository((operation) => operation(transaction));
}
