ALTER TABLE "accounts" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "user_id" uuid;--> statement-breakpoint
UPDATE "accounts" SET "user_id" = "id" WHERE "user_id" IS NULL;--> statement-breakpoint
ALTER TABLE "accounts" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_unique" UNIQUE("user_id");--> statement-breakpoint
DROP POLICY "accounts_owner_select" ON "accounts";--> statement-breakpoint
DROP POLICY "accounts_owner_insert" ON "accounts";--> statement-breakpoint
DROP POLICY "accounts_owner_update" ON "accounts";--> statement-breakpoint
CREATE POLICY "accounts_owner_select" ON "accounts" FOR SELECT TO authenticated USING ("user_id" = auth.uid());--> statement-breakpoint
CREATE POLICY "accounts_owner_insert" ON "accounts" FOR INSERT TO authenticated WITH CHECK ("user_id" = auth.uid());--> statement-breakpoint
CREATE POLICY "accounts_owner_update" ON "accounts" FOR UPDATE TO authenticated USING ("user_id" = auth.uid()) WITH CHECK ("user_id" = auth.uid());
