GRANT UPDATE ON TABLE "hand_receipts" TO authenticated;--> statement-breakpoint
CREATE POLICY "hand_receipts_owner_update" ON "hand_receipts" FOR UPDATE TO authenticated USING ("account_id" = (SELECT "id" FROM "accounts" WHERE "auth_user_id" = "app"."current_auth_subject"())) WITH CHECK ("account_id" = (SELECT "id" FROM "accounts" WHERE "auth_user_id" = "app"."current_auth_subject"()));
