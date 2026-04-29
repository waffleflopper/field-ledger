import { createDatabaseClient } from "../src/modules/provider-boundaries/database/postgres";

async function main() {
  const sql = createDatabaseClient();

  try {
    const [result] = await sql<{ ok: number }[]>`select 1 as ok`;

    if (result?.ok !== 1) {
      throw new Error("Unexpected database health check response.");
    }

    console.log("Local Supabase Postgres connection OK.");
  } finally {
    await sql.end();
  }
}

void main();
