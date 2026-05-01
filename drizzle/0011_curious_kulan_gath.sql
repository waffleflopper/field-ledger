CREATE TYPE "public"."hand_receipt_status" AS ENUM('active', 'archived');--> statement-breakpoint
CREATE TABLE "hand_receipts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"name" text NOT NULL,
	"notes" text,
	"hand_receipt_number" text,
	"holder_name" text,
	"unit_name" text,
	"uic" text,
	"effective_date" date,
	"status" "hand_receipt_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "hand_receipts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "hand_receipts" ADD CONSTRAINT "hand_receipts_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "hand_receipts_account_id_status_created_at_idx" ON "hand_receipts" USING btree ("account_id","status","created_at" DESC NULLS LAST);--> statement-breakpoint
GRANT SELECT, INSERT ON TABLE "hand_receipts" TO authenticated;--> statement-breakpoint
CREATE POLICY "hand_receipts_owner_select" ON "hand_receipts" FOR SELECT TO authenticated USING ("account_id" = (SELECT "id" FROM "accounts" WHERE "auth_user_id" = "app"."current_auth_subject"()));--> statement-breakpoint
CREATE POLICY "hand_receipts_owner_insert" ON "hand_receipts" FOR INSERT TO authenticated WITH CHECK ("account_id" = (SELECT "id" FROM "accounts" WHERE "auth_user_id" = "app"."current_auth_subject"()));
