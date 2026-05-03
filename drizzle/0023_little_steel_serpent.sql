CREATE TYPE "public"."assignment_status" AS ENUM('active', 'closed');--> statement-breakpoint
CREATE TABLE "assignment_item_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"assignment_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"status" "assignment_status" DEFAULT 'active' NOT NULL,
	"closed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assignment_item_links_status_closed_at_chk" CHECK (("status" = 'active' AND "closed_at" IS NULL) OR ("status" = 'closed' AND "closed_at" IS NOT NULL))
);
--> statement-breakpoint
ALTER TABLE "assignment_item_links" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"hand_receipt_id" uuid NOT NULL,
	"contact_id" uuid NOT NULL,
	"document_id" uuid NOT NULL,
	"status" "assignment_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assignments_id_account_id_key" UNIQUE("id","account_id")
);
--> statement-breakpoint
ALTER TABLE "assignments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_id_account_id_key" UNIQUE("id","account_id");--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_id_account_id_key" UNIQUE("id","account_id");--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_id_account_id_key" UNIQUE("id","account_id");--> statement-breakpoint
ALTER TABLE "assignment_item_links" ADD CONSTRAINT "assignment_item_links_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_item_links" ADD CONSTRAINT "assignment_item_links_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_item_links" ADD CONSTRAINT "assignment_item_links_assignment_account_fk" FOREIGN KEY ("assignment_id","account_id") REFERENCES "public"."assignments"("id","account_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_item_links" ADD CONSTRAINT "assignment_item_links_item_account_fk" FOREIGN KEY ("item_id","account_id") REFERENCES "public"."items"("id","account_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_contact_account_fk" FOREIGN KEY ("contact_id","account_id") REFERENCES "public"."contacts"("id","account_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_hand_receipt_account_fk" FOREIGN KEY ("hand_receipt_id","account_id") REFERENCES "public"."hand_receipts"("id","account_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_document_account_fk" FOREIGN KEY ("document_id","account_id") REFERENCES "public"."documents"("id","account_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "assignment_item_links_one_active_item_idx" ON "assignment_item_links" USING btree ("item_id") WHERE "assignment_item_links"."status" = 'active';--> statement-breakpoint
CREATE INDEX "assignment_item_links_assignment_id_status_idx" ON "assignment_item_links" USING btree ("assignment_id","status");--> statement-breakpoint
CREATE INDEX "assignment_item_links_account_id_item_id_status_idx" ON "assignment_item_links" USING btree ("account_id","item_id","status");--> statement-breakpoint
CREATE INDEX "assignments_account_id_status_created_at_idx" ON "assignments" USING btree ("account_id","status","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "assignments_hand_receipt_id_status_idx" ON "assignments" USING btree ("hand_receipt_id","status");--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON TABLE "assignments" TO authenticated;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON TABLE "assignment_item_links" TO authenticated;--> statement-breakpoint
CREATE POLICY "assignments_owner_select" ON "assignments" FOR SELECT TO authenticated USING ("account_id" = (SELECT "id" FROM "accounts" WHERE "auth_user_id" = "app"."current_auth_subject"()));--> statement-breakpoint
CREATE POLICY "assignments_owner_insert" ON "assignments" FOR INSERT TO authenticated WITH CHECK ("account_id" = (SELECT "id" FROM "accounts" WHERE "auth_user_id" = "app"."current_auth_subject"()));--> statement-breakpoint
CREATE POLICY "assignments_owner_update" ON "assignments" FOR UPDATE TO authenticated USING ("account_id" = (SELECT "id" FROM "accounts" WHERE "auth_user_id" = "app"."current_auth_subject"())) WITH CHECK ("account_id" = (SELECT "id" FROM "accounts" WHERE "auth_user_id" = "app"."current_auth_subject"()));--> statement-breakpoint
CREATE POLICY "assignment_item_links_owner_select" ON "assignment_item_links" FOR SELECT TO authenticated USING ("account_id" = (SELECT "id" FROM "accounts" WHERE "auth_user_id" = "app"."current_auth_subject"()));--> statement-breakpoint
CREATE POLICY "assignment_item_links_owner_insert" ON "assignment_item_links" FOR INSERT TO authenticated WITH CHECK ("account_id" = (SELECT "id" FROM "accounts" WHERE "auth_user_id" = "app"."current_auth_subject"()));--> statement-breakpoint
CREATE POLICY "assignment_item_links_owner_update" ON "assignment_item_links" FOR UPDATE TO authenticated USING ("account_id" = (SELECT "id" FROM "accounts" WHERE "auth_user_id" = "app"."current_auth_subject"())) WITH CHECK ("account_id" = (SELECT "id" FROM "accounts" WHERE "auth_user_id" = "app"."current_auth_subject"()));
