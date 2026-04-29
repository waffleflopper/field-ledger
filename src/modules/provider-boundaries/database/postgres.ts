import postgres from "postgres";

type PostgresClient = ReturnType<typeof postgres>;

declare global {
  var __fieldLedgerPostgresClient: PostgresClient | undefined;
}

// Temporary Phase 1 local scaffold default. This privileged local URL lets the
// server initialize the first account before an app-role/RLS session boundary
// exists. Replace before adding more account-owned runtime tables.
const localPrivilegedDatabaseUrl =
  "postgresql://postgres:postgres@127.0.0.1:54332/postgres";

export function getDatabaseUrl() {
  return process.env.DATABASE_URL ?? localPrivilegedDatabaseUrl;
}

export function createDatabaseClient(databaseUrl = getDatabaseUrl()) {
  if (databaseUrl !== getDatabaseUrl()) {
    return postgres(databaseUrl, {
      max: 1,
    });
  }

  globalThis.__fieldLedgerPostgresClient ??= postgres(databaseUrl, {
    max: 1,
  });

  return globalThis.__fieldLedgerPostgresClient;
}
