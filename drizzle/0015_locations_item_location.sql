CREATE TABLE "locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "locations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "location_id" uuid;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "locations_account_id_name_idx" ON "locations" USING btree ("account_id","name");--> statement-breakpoint
CREATE INDEX "items_account_id_location_id_idx" ON "items" USING btree ("account_id","location_id");--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON TABLE "locations" TO authenticated;--> statement-breakpoint
CREATE POLICY "locations_owner_select" ON "locations" FOR SELECT TO authenticated USING ("account_id" = (SELECT "id" FROM "accounts" WHERE "auth_user_id" = "app"."current_auth_subject"()));--> statement-breakpoint
CREATE POLICY "locations_owner_insert" ON "locations" FOR INSERT TO authenticated WITH CHECK ("account_id" = (SELECT "id" FROM "accounts" WHERE "auth_user_id" = "app"."current_auth_subject"()));--> statement-breakpoint
CREATE POLICY "locations_owner_update" ON "locations" FOR UPDATE TO authenticated USING ("account_id" = (SELECT "id" FROM "accounts" WHERE "auth_user_id" = "app"."current_auth_subject"())) WITH CHECK ("account_id" = (SELECT "id" FROM "accounts" WHERE "auth_user_id" = "app"."current_auth_subject"()));--> statement-breakpoint
CREATE POLICY "items_location_owner_insert" ON "items" AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK ("location_id" IS NULL OR EXISTS (SELECT 1 FROM "locations" WHERE "locations"."id" = "items"."location_id" AND "locations"."account_id" = "items"."account_id"));--> statement-breakpoint
CREATE POLICY "items_location_owner_update" ON "items" AS RESTRICTIVE FOR UPDATE TO authenticated WITH CHECK ("location_id" IS NULL OR EXISTS (SELECT 1 FROM "locations" WHERE "locations"."id" = "items"."location_id" AND "locations"."account_id" = "items"."account_id"));
