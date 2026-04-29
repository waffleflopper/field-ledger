import postgres from "postgres";

// Temporary Phase 1 local scaffold default. This privileged local URL lets the
// server initialize the first account before an app-role/RLS session boundary
// exists. Replace before adding more account-owned runtime tables.
const localPrivilegedDatabaseUrl =
  "postgresql://postgres:postgres@127.0.0.1:54332/postgres";

export function getDatabaseUrl() {
  return process.env.DATABASE_URL ?? localPrivilegedDatabaseUrl;
}

export function createDatabaseClient(databaseUrl = getDatabaseUrl()) {
  return postgres(databaseUrl, {
    max: 1,
  });
}
