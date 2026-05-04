CREATE POLICY "assignment_item_links_same_hand_receipt_insert"
ON "assignment_item_links"
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM "items"
    WHERE "items"."id" = "assignment_item_links"."item_id"
      AND "items"."account_id" = "assignment_item_links"."account_id"
      AND "items"."hand_receipt_id" = (
        SELECT "assignments"."hand_receipt_id"
        FROM "assignments"
        WHERE "assignments"."id" = "assignment_item_links"."assignment_id"
          AND "assignments"."account_id" = "assignment_item_links"."account_id"
      )
  )
);--> statement-breakpoint
CREATE POLICY "assignment_item_links_same_hand_receipt_update"
ON "assignment_item_links"
AS RESTRICTIVE
FOR UPDATE
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM "items"
    WHERE "items"."id" = "assignment_item_links"."item_id"
      AND "items"."account_id" = "assignment_item_links"."account_id"
      AND "items"."hand_receipt_id" = (
        SELECT "assignments"."hand_receipt_id"
        FROM "assignments"
        WHERE "assignments"."id" = "assignment_item_links"."assignment_id"
          AND "assignments"."account_id" = "assignment_item_links"."account_id"
      )
  )
);
