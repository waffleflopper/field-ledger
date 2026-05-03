DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'assignment_item_links_status_closed_at_chk'
      AND conrelid = 'assignment_item_links'::regclass
  ) THEN
    ALTER TABLE "assignment_item_links"
      ADD CONSTRAINT "assignment_item_links_status_closed_at_chk"
      CHECK (
        ("status" = 'active' AND "closed_at" IS NULL)
        OR
        ("status" = 'closed' AND "closed_at" IS NOT NULL)
      );
  END IF;
END $$;
