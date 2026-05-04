import Link from "next/link";
import { ReceiptText } from "lucide-react";

import { Button } from "@/components/ui/button";

export function Active2062sEmptyState() {
  return (
    <section className="rounded-lg border bg-card p-4 text-card-foreground">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
          <ReceiptText aria-hidden="true" className="size-4" />
        </span>
        <div className="min-w-0 flex-1 space-y-3">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold tracking-normal">
              No active 2062s
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Formal 2062 assignments will appear here after you upload a
              private document and link it to property.
            </p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href="/app/hand-receipts">Open hand receipts</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
