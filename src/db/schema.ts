import { integer, pgSchema, timestamp } from "drizzle-orm/pg-core";

export const appInternal = pgSchema("app_internal");

export const scaffoldMigrationChecks = appInternal.table(
  "scaffold_migration_checks",
  {
    id: integer("id").primaryKey(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
);
