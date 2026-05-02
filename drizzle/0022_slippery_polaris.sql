ALTER TABLE "documents" ADD COLUMN "hand_receipt_id" uuid;--> statement-breakpoint
ALTER TABLE "hand_receipts" ADD CONSTRAINT "hand_receipts_id_account_id_key" UNIQUE("id","account_id");--> statement-breakpoint
DO $$
BEGIN
	IF EXISTS (SELECT 1 FROM "documents" WHERE "hand_receipt_id" IS NULL) THEN
		RAISE EXCEPTION 'Backfill required: documents.hand_receipt_id contains NULL rows';
	END IF;
END
$$;--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "hand_receipt_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_hand_receipt_account_fk" FOREIGN KEY ("hand_receipt_id","account_id") REFERENCES "public"."hand_receipts"("id","account_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "documents_account_id_hand_receipt_id_idx" ON "documents" USING btree ("account_id","hand_receipt_id");
