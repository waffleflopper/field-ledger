import postgres from "postgres";

const localDatabaseUrl =
  "postgresql://postgres:postgres@127.0.0.1:54332/postgres";

export function getDatabaseUrl() {
  return process.env.DATABASE_URL ?? localDatabaseUrl;
}

export function createDatabaseClient(databaseUrl = getDatabaseUrl()) {
  return postgres(databaseUrl, {
    max: 1,
  });
}
