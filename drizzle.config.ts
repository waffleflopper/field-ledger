import { defineConfig } from "drizzle-kit";

const localDatabaseUrl =
  "postgresql://postgres:postgres@127.0.0.1:54332/postgres";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? localDatabaseUrl,
  },
  strict: true,
  verbose: true,
});
