CREATE SCHEMA "app_internal";
--> statement-breakpoint
CREATE TABLE "app_internal"."scaffold_migration_checks" (
	"id" integer PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
