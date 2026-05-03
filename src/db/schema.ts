import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgSchema,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
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

export const handReceiptStatusEnum = pgEnum("hand_receipt_status", [
  "active",
  "archived",
]);

export const itemStatusEnum = pgEnum("item_status", ["active", "archived"]);

export const assignmentStatusEnum = pgEnum("assignment_status", [
  "active",
  "closed",
]);

export const requirementIntervalTypeEnum = pgEnum("requirement_interval_type", [
  "weekly",
  "monthly",
  "quarterly",
  "semiannual",
  "annual",
  "custom_days",
  "custom_months",
]);

export const requirementStatusEnum = pgEnum("requirement_status", ["active"]);

export const authUser = pgTable("user", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const authSession = pgTable(
  "session",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUser.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_user_id_idx").on(table.userId)],
);

export const authAccount = pgTable(
  "account",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUser.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("account_user_id_idx").on(table.userId)],
);

export const authVerification = pgTable(
  "verification",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

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
    nextItemSequence: integer("next_item_sequence").notNull().default(1),
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

export const auditEvents = pgTable(
  "audit_events",
  {
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
  },
  (table) => [
    index("audit_events_account_id_occurred_at_idx").on(
      table.accountId,
      table.occurredAt.desc(),
    ),
  ],
).enableRLS();

export const handReceipts = pgTable(
  "hand_receipts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id),
    name: text("name").notNull(),
    notes: text("notes"),
    handReceiptNumber: text("hand_receipt_number"),
    holderName: text("holder_name"),
    unitName: text("unit_name"),
    uic: text("uic"),
    effectiveDate: date("effective_date"),
    status: handReceiptStatusEnum("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("hand_receipts_id_account_id_key").on(table.id, table.accountId),
    index("hand_receipts_account_id_status_created_at_idx").on(
      table.accountId,
      table.status,
      table.createdAt.desc(),
    ),
  ],
).enableRLS();

export const contacts = pgTable(
  "contacts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id),
    displayName: text("display_name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("contacts_id_account_id_key").on(table.id, table.accountId),
    index("contacts_account_id_display_name_idx").on(
      table.accountId,
      table.displayName,
    ),
  ],
).enableRLS();

export const locations = pgTable(
  "locations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("locations_account_id_lower_name_unique_idx").on(
      table.accountId,
      sql`lower(${table.name})`,
    ),
  ],
).enableRLS();

export const items = pgTable(
  "items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id),
    handReceiptId: uuid("hand_receipt_id")
      .notNull()
      .references(() => handReceipts.id),
    nomenclature: text("nomenclature").notNull(),
    ecn: text("ecn"),
    serialNumber: text("serial_number"),
    generatedId: text("generated_id"),
    notes: text("notes"),
    status: itemStatusEnum("status").notNull().default("active"),
    signedToContactId: uuid("signed_to_contact_id").references(
      () => contacts.id,
      {
        onDelete: "set null",
      },
    ),
    locationId: uuid("location_id").references(() => locations.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("items_id_account_id_key").on(table.id, table.accountId),
    index("items_account_id_status_created_at_idx").on(
      table.accountId,
      table.status,
      table.createdAt.desc(),
    ),
    index("items_hand_receipt_id_status_created_at_idx").on(
      table.handReceiptId,
      table.status,
      table.createdAt.desc(),
    ),
    index("items_account_id_ecn_idx").on(table.accountId, table.ecn),
    index("items_account_id_serial_number_idx").on(
      table.accountId,
      table.serialNumber,
    ),
    uniqueIndex("items_account_id_generated_id_unique_idx").on(
      table.accountId,
      table.generatedId,
    ),
    index("items_account_id_location_id_idx").on(
      table.accountId,
      table.locationId,
    ),
  ],
).enableRLS();

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id),
    handReceiptId: uuid("hand_receipt_id").notNull(),
    filename: text("filename").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    storagePath: text("storage_path").notNull(),
    uploadedAt: timestamp("uploaded_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("documents_id_account_id_key").on(table.id, table.accountId),
    foreignKey({
      columns: [table.handReceiptId, table.accountId],
      foreignColumns: [handReceipts.id, handReceipts.accountId],
      name: "documents_hand_receipt_account_fk",
    }),
    index("documents_account_id_created_at_idx").on(
      table.accountId,
      table.createdAt.desc(),
    ),
    index("documents_account_id_hand_receipt_id_idx").on(
      table.accountId,
      table.handReceiptId,
    ),
    uniqueIndex("documents_account_id_storage_path_unique_idx").on(
      table.accountId,
      table.storagePath,
    ),
    check(
      "documents_storage_path_matches_account_and_id",
      sql`${table.storagePath} = ${table.accountId}::text || '/' || ${table.id}::text`,
    ),
  ],
).enableRLS();

export const assignments = pgTable(
  "assignments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id),
    handReceiptId: uuid("hand_receipt_id").notNull(),
    contactId: uuid("contact_id").notNull(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id),
    status: assignmentStatusEnum("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("assignments_id_account_id_key").on(table.id, table.accountId),
    foreignKey({
      columns: [table.contactId, table.accountId],
      foreignColumns: [contacts.id, contacts.accountId],
      name: "assignments_contact_account_fk",
    }),
    foreignKey({
      columns: [table.handReceiptId, table.accountId],
      foreignColumns: [handReceipts.id, handReceipts.accountId],
      name: "assignments_hand_receipt_account_fk",
    }),
    foreignKey({
      columns: [table.documentId, table.accountId],
      foreignColumns: [documents.id, documents.accountId],
      name: "assignments_document_account_fk",
    }),
    index("assignments_account_id_status_created_at_idx").on(
      table.accountId,
      table.status,
      table.createdAt.desc(),
    ),
    index("assignments_hand_receipt_id_status_idx").on(
      table.handReceiptId,
      table.status,
    ),
  ],
).enableRLS();

export const assignmentItemLinks = pgTable(
  "assignment_item_links",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id),
    assignmentId: uuid("assignment_id").notNull(),
    itemId: uuid("item_id")
      .notNull()
      .references(() => items.id),
    status: assignmentStatusEnum("status").notNull().default("active"),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.assignmentId, table.accountId],
      foreignColumns: [assignments.id, assignments.accountId],
      name: "assignment_item_links_assignment_account_fk",
    }),
    foreignKey({
      columns: [table.itemId, table.accountId],
      foreignColumns: [items.id, items.accountId],
      name: "assignment_item_links_item_account_fk",
    }),
    uniqueIndex("assignment_item_links_one_active_item_idx")
      .on(table.itemId)
      .where(sql`${table.status} = 'active'`),
    index("assignment_item_links_assignment_id_status_idx").on(
      table.assignmentId,
      table.status,
    ),
    index("assignment_item_links_account_id_item_id_status_idx").on(
      table.accountId,
      table.itemId,
      table.status,
    ),
  ],
).enableRLS();

export const requirements = pgTable(
  "requirements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id),
    itemId: uuid("item_id")
      .notNull()
      .references(() => items.id),
    name: text("name").notNull(),
    notes: text("notes"),
    intervalType: requirementIntervalTypeEnum("interval_type").notNull(),
    intervalValue: integer("interval_value"),
    nextDueDate: date("next_due_date").notNull(),
    status: requirementStatusEnum("status").notNull().default("active"),
    pausedAt: timestamp("paused_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("requirements_id_account_id_key").on(table.id, table.accountId),
    index("requirements_account_id_item_id_status_idx").on(
      table.accountId,
      table.itemId,
      table.status,
    ),
    index("requirements_account_id_next_due_idx").on(
      table.accountId,
      table.nextDueDate,
    ),
    check(
      "requirements_interval_value_chk",
      sql`(
        (${table.intervalType} in ('custom_days', 'custom_months') and ${table.intervalValue} is not null and ${table.intervalValue} > 0)
        or
        (${table.intervalType} in ('weekly', 'monthly', 'quarterly', 'semiannual', 'annual') and ${table.intervalValue} is null)
      )`,
    ),
  ],
).enableRLS();

export const requirementCompletions = pgTable(
  "requirement_completions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id),
    requirementId: uuid("requirement_id").notNull(),
    completedOn: date("completed_on").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.requirementId, table.accountId],
      foreignColumns: [requirements.id, requirements.accountId],
      name: "requirement_completions_requirement_account_fk",
    }),
    index("requirement_completions_requirement_completed_idx").on(
      table.requirementId,
      table.completedOn.desc(),
    ),
    index("requirement_completions_account_id_created_at_idx").on(
      table.accountId,
      table.createdAt.desc(),
    ),
  ],
).enableRLS();
