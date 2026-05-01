import { sql } from "drizzle-orm";

import type { createDrizzleClient } from "./drizzle";

type DrizzleClient = ReturnType<typeof createDrizzleClient>;
export type AuthenticatedDatabaseTransaction = Parameters<
  Parameters<DrizzleClient["transaction"]>[0]
>[0];

export type AuthenticatedDatabaseSession = {
  authSubject: string;
};

export async function runWithAuthenticatedDatabaseSession<T>(
  db: DrizzleClient,
  session: AuthenticatedDatabaseSession,
  operation: (transaction: AuthenticatedDatabaseTransaction) => Promise<T>,
) {
  if (!session.authSubject.trim()) {
    throw new Error(
      "Authenticated database session requires a non-empty authSubject.",
    );
  }

  return db.transaction(async (transaction) => {
    await transaction.execute(sql`set local role authenticated`);
    await transaction.execute(
      sql`select set_config('app.current_auth_subject', ${session.authSubject}, true)`,
    );

    return operation(transaction);
  });
}
