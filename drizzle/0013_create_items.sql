ALTER TABLE "accounts" ADD COLUMN "next_item_sequence" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
CREATE TYPE "public"."item_status" AS ENUM('active', 'archived');--> statement-breakpoint
CREATE TABLE "items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"hand_receipt_id" uuid NOT NULL,
	"nomenclature" text NOT NULL,
	"ecn" text,
	"serial_number" text,
	"generated_id" text,
	"notes" text,
	"status" "item_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_hand_receipt_id_hand_receipts_id_fk" FOREIGN KEY ("hand_receipt_id") REFERENCES "public"."hand_receipts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "items_account_id_status_created_at_idx" ON "items" USING btree ("account_id","status","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "items_hand_receipt_id_status_created_at_idx" ON "items" USING btree ("hand_receipt_id","status","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "items_account_id_ecn_idx" ON "items" USING btree ("account_id","ecn");--> statement-breakpoint
CREATE INDEX "items_account_id_serial_number_idx" ON "items" USING btree ("account_id","serial_number");--> statement-breakpoint
CREATE UNIQUE INDEX "items_account_id_generated_id_unique_idx" ON "items" USING btree ("account_id","generated_id");--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON TABLE "items" TO authenticated;--> statement-breakpoint
CREATE POLICY "items_owner_select" ON "items" FOR SELECT TO authenticated USING ("account_id" = (SELECT "id" FROM "accounts" WHERE "auth_user_id" = "app"."current_auth_subject"()));--> statement-breakpoint
CREATE POLICY "items_owner_insert" ON "items" FOR INSERT TO authenticated WITH CHECK ("account_id" = (SELECT "id" FROM "accounts" WHERE "auth_user_id" = "app"."current_auth_subject"()) AND EXISTS (SELECT 1 FROM "hand_receipts" WHERE "hand_receipts"."id" = "items"."hand_receipt_id" AND "hand_receipts"."account_id" = "items"."account_id"));--> statement-breakpoint
CREATE POLICY "items_owner_update" ON "items" FOR UPDATE TO authenticated USING ("account_id" = (SELECT "id" FROM "accounts" WHERE "auth_user_id" = "app"."current_auth_subject"())) WITH CHECK ("account_id" = (SELECT "id" FROM "accounts" WHERE "auth_user_id" = "app"."current_auth_subject"()) AND EXISTS (SELECT 1 FROM "hand_receipts" WHERE "hand_receipts"."id" = "items"."hand_receipt_id" AND "hand_receipts"."account_id" = "items"."account_id"));
