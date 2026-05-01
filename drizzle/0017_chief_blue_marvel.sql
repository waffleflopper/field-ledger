CREATE TABLE "requirement_completions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"requirement_id" uuid NOT NULL,
	"completed_on" date NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "requirement_completions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "requirement_completions" ADD CONSTRAINT "requirement_completions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requirement_completions" ADD CONSTRAINT "requirement_completions_requirement_id_requirements_id_fk" FOREIGN KEY ("requirement_id") REFERENCES "public"."requirements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "requirement_completions_requirement_completed_idx" ON "requirement_completions" USING btree ("requirement_id","completed_on" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "requirement_completions_account_id_created_at_idx" ON "requirement_completions" USING btree ("account_id","created_at" DESC NULLS LAST);--> statement-breakpoint
GRANT SELECT, INSERT ON TABLE "requirement_completions" TO authenticated;--> statement-breakpoint
GRANT UPDATE ON TABLE "requirements" TO authenticated;--> statement-breakpoint
CREATE POLICY "requirement_completions_owner_select" ON "requirement_completions" FOR SELECT TO authenticated USING ("account_id" = (SELECT "id" FROM "accounts" WHERE "auth_user_id" = "app"."current_auth_subject"()));--> statement-breakpoint
CREATE POLICY "requirement_completions_owner_insert" ON "requirement_completions" FOR INSERT TO authenticated WITH CHECK ("account_id" = (SELECT "id" FROM "accounts" WHERE "auth_user_id" = "app"."current_auth_subject"()) AND EXISTS (SELECT 1 FROM "requirements" WHERE "requirements"."id" = "requirement_completions"."requirement_id" AND "requirements"."account_id" = "requirement_completions"."account_id"));--> statement-breakpoint
CREATE POLICY "requirements_owner_update" ON "requirements" FOR UPDATE TO authenticated USING ("account_id" = (SELECT "id" FROM "accounts" WHERE "auth_user_id" = "app"."current_auth_subject"())) WITH CHECK ("account_id" = (SELECT "id" FROM "accounts" WHERE "auth_user_id" = "app"."current_auth_subject"()) AND EXISTS (SELECT 1 FROM "items" WHERE "items"."id" = "requirements"."item_id" AND "items"."account_id" = "requirements"."account_id"));
