import { sql } from "drizzle-orm";
import {
  check,
  integer,
  jsonb,
  pgEnum,
  pgSchema,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

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

export const accessStateEnum = pgEnum("access_state", [
  "trialing",
  "active",
  "paused_read_only",
]);

export const subscriptionTierEnum = pgEnum("subscription_tier", [
  "base",
  "pro",
]);

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("auth_user_id").notNull().unique(),
    accessState: accessStateEnum("access_state").notNull().default("trialing"),
    subscriptionTier: subscriptionTierEnum("subscription_tier"),
    trialStartsAt: timestamp("trial_starts_at", {
      withTimezone: true,
    }).notNull(),
    trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }).notNull(),
    onboardingCompletedAt: timestamp("onboarding_completed_at", {
      withTimezone: true,
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "accounts_trial_window_check",
      sql`${table.trialEndsAt} >= ${table.trialStartsAt}`,
    ),
  ],
).enableRLS();

export const auditEvents = pgTable("audit_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  accountId: uuid("account_id")
    .notNull()
    .references(() => accounts.id),
  actorId: text("actor_id").notNull(),
  action: text("action").notNull(),
  targetType: text("target_type"),
  targetId: text("target_id"),
  occurredAt: timestamp("occurred_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}).enableRLS();
