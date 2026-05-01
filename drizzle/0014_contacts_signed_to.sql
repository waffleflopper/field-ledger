CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"display_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contacts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "signed_to_contact_id" uuid;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_signed_to_contact_id_contacts_id_fk" FOREIGN KEY ("signed_to_contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contacts_account_id_display_name_idx" ON "contacts" USING btree ("account_id","display_name");--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON TABLE "contacts" TO authenticated;--> statement-breakpoint
CREATE POLICY "contacts_owner_select" ON "contacts" FOR SELECT TO authenticated USING ("account_id" = (SELECT "id" FROM "accounts" WHERE "auth_user_id" = "app"."current_auth_subject"()));--> statement-breakpoint
CREATE POLICY "contacts_owner_insert" ON "contacts" FOR INSERT TO authenticated WITH CHECK ("account_id" = (SELECT "id" FROM "accounts" WHERE "auth_user_id" = "app"."current_auth_subject"()));--> statement-breakpoint
CREATE POLICY "contacts_owner_update" ON "contacts" FOR UPDATE TO authenticated USING ("account_id" = (SELECT "id" FROM "accounts" WHERE "auth_user_id" = "app"."current_auth_subject"())) WITH CHECK ("account_id" = (SELECT "id" FROM "accounts" WHERE "auth_user_id" = "app"."current_auth_subject"()));--> statement-breakpoint
CREATE POLICY "items_signed_to_contact_owner_insert" ON "items" AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK ("signed_to_contact_id" IS NULL OR EXISTS (SELECT 1 FROM "contacts" WHERE "contacts"."id" = "items"."signed_to_contact_id" AND "contacts"."account_id" = "items"."account_id"));--> statement-breakpoint
CREATE POLICY "items_signed_to_contact_owner_update" ON "items" AS RESTRICTIVE FOR UPDATE TO authenticated WITH CHECK ("signed_to_contact_id" IS NULL OR EXISTS (SELECT 1 FROM "contacts" WHERE "contacts"."id" = "items"."signed_to_contact_id" AND "contacts"."account_id" = "items"."account_id"));
