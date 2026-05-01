CREATE TYPE "public"."requirement_interval_type" AS ENUM('weekly', 'monthly', 'quarterly', 'semiannual', 'annual', 'custom_days', 'custom_months');--> statement-breakpoint
CREATE TYPE "public"."requirement_status" AS ENUM('active');--> statement-breakpoint
CREATE TABLE "requirements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"name" text NOT NULL,
	"interval_type" "requirement_interval_type" NOT NULL,
	"interval_value" integer,
	"next_due_date" date NOT NULL,
	"status" "requirement_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "requirements" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "requirements" ADD CONSTRAINT "requirements_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requirements" ADD CONSTRAINT "requirements_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "requirements_account_id_item_id_status_idx" ON "requirements" USING btree ("account_id","item_id","status");
--> statement-breakpoint
GRANT SELECT, INSERT ON TABLE "requirements" TO authenticated;--> statement-breakpoint
CREATE POLICY "requirements_owner_select" ON "requirements" FOR SELECT TO authenticated USING ("account_id" = (SELECT "id" FROM "accounts" WHERE "auth_user_id" = "app"."current_auth_subject"()));--> statement-breakpoint
CREATE POLICY "requirements_owner_insert" ON "requirements" FOR INSERT TO authenticated WITH CHECK ("account_id" = (SELECT "id" FROM "accounts" WHERE "auth_user_id" = "app"."current_auth_subject"()) AND EXISTS (SELECT 1 FROM "items" WHERE "items"."id" = "requirements"."item_id" AND "items"."account_id" = "requirements"."account_id"));
