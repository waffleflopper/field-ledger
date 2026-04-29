CREATE TYPE "public"."access_state" AS ENUM('trialing', 'active', 'paused_read_only');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"access_state" "access_state" DEFAULT 'trialing' NOT NULL,
	"trial_starts_at" timestamp with time zone NOT NULL,
	"trial_ends_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
GRANT USAGE ON SCHEMA "public" TO authenticated;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON TABLE "accounts" TO authenticated;
--> statement-breakpoint
CREATE POLICY "accounts_owner_select" ON "accounts" FOR SELECT TO authenticated USING ("id" = auth.uid());
--> statement-breakpoint
CREATE POLICY "accounts_owner_insert" ON "accounts" FOR INSERT TO authenticated WITH CHECK ("id" = auth.uid());
--> statement-breakpoint
CREATE POLICY "accounts_owner_update" ON "accounts" FOR UPDATE TO authenticated USING ("id" = auth.uid()) WITH CHECK ("id" = auth.uid());
