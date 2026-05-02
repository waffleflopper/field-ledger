ALTER TABLE "documents" ADD COLUMN "hand_receipt_id" uuid;--> statement-breakpoint
DELETE FROM "documents" WHERE "hand_receipt_id" IS NULL;--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "hand_receipt_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_hand_receipt_id_hand_receipts_id_fk" FOREIGN KEY ("hand_receipt_id") REFERENCES "public"."hand_receipts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "documents_account_id_hand_receipt_id_idx" ON "documents" USING btree ("account_id","hand_receipt_id");
