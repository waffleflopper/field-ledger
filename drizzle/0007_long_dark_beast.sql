CREATE SCHEMA IF NOT EXISTS "app";--> statement-breakpoint
CREATE OR REPLACE FUNCTION "app"."current_auth_subject"()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT current_setting('app.current_auth_subject', true)::text;
$$;--> statement-breakpoint
GRANT USAGE ON SCHEMA "app" TO authenticated;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION "app"."current_auth_subject"() TO authenticated;--> statement-breakpoint
DROP POLICY IF EXISTS "accounts_owner_select" ON "accounts";--> statement-breakpoint
DROP POLICY IF EXISTS "accounts_owner_insert" ON "accounts";--> statement-breakpoint
DROP POLICY IF EXISTS "accounts_owner_update" ON "accounts";--> statement-breakpoint
DROP POLICY IF EXISTS "audit_events_owner_select" ON "audit_events";--> statement-breakpoint
DROP POLICY IF EXISTS "audit_events_owner_insert" ON "audit_events";--> statement-breakpoint
ALTER TABLE "accounts" RENAME COLUMN "user_id" TO "auth_user_id";--> statement-breakpoint
ALTER TABLE "accounts" DROP CONSTRAINT "accounts_user_id_unique";--> statement-breakpoint
ALTER TABLE "accounts" ALTER COLUMN "auth_user_id" SET DATA TYPE text USING "auth_user_id"::text;--> statement-breakpoint
ALTER TABLE "audit_events" ALTER COLUMN "actor_id" SET DATA TYPE text USING "actor_id"::text;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_auth_user_id_unique" UNIQUE("auth_user_id");--> statement-breakpoint
CREATE POLICY "accounts_owner_select" ON "accounts" FOR SELECT TO authenticated USING ("auth_user_id" = "app"."current_auth_subject"());--> statement-breakpoint
CREATE POLICY "accounts_owner_insert" ON "accounts" FOR INSERT TO authenticated WITH CHECK ("auth_user_id" = "app"."current_auth_subject"());--> statement-breakpoint
CREATE POLICY "accounts_owner_update" ON "accounts" FOR UPDATE TO authenticated USING ("auth_user_id" = "app"."current_auth_subject"()) WITH CHECK ("auth_user_id" = "app"."current_auth_subject"());--> statement-breakpoint
CREATE POLICY "audit_events_owner_select" ON "audit_events" FOR SELECT TO authenticated USING ("account_id" = (SELECT "id" FROM "accounts" WHERE "auth_user_id" = "app"."current_auth_subject"()));--> statement-breakpoint
CREATE POLICY "audit_events_owner_insert" ON "audit_events" FOR INSERT TO authenticated WITH CHECK ("account_id" = (SELECT "id" FROM "accounts" WHERE "auth_user_id" = "app"."current_auth_subject"()));
