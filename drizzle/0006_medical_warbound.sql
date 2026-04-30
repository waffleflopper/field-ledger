CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"actor_id" uuid NOT NULL,
	"action" text NOT NULL,
	"target_type" text,
	"target_id" text,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
GRANT USAGE ON SCHEMA "public" TO authenticated;--> statement-breakpoint
GRANT SELECT, INSERT ON TABLE "audit_events" TO authenticated;--> statement-breakpoint
CREATE POLICY "audit_events_owner_select" ON "audit_events" FOR SELECT TO authenticated USING ("account_id" = (SELECT "id" FROM "accounts" WHERE "user_id" = auth.uid()));--> statement-breakpoint
CREATE POLICY "audit_events_owner_insert" ON "audit_events" FOR INSERT TO authenticated WITH CHECK ("account_id" = (SELECT "id" FROM "accounts" WHERE "user_id" = auth.uid()));
