DROP INDEX IF EXISTS "locations_account_id_lower_name_unique_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "locations_account_id_lower_name_unique_idx" ON "locations" USING btree ("account_id", lower("name")) WHERE "archived_at" IS NULL;
