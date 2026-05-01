import Link from "next/link";
import { Archive, ClipboardList, PackageSearch } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ItemSearchStartState() {
  return (
    <section className="rounded-lg border bg-card p-4 text-card-foreground">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
          <PackageSearch aria-hidden="true" className="size-4" />
        </span>
        <div className="min-w-0 space-y-3">
          <div className="space-y-1">
            <h2 className="text-base font-semibold tracking-normal">
              Search accountable property
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Look up active items by identifier, nomenclature, hand receipt,
              signed-to contact, or location. Add new items from the hand
              receipt they belong to.
            </p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href="/app/hand-receipts">
              <ClipboardList aria-hidden="true" className="size-4" />
              Browse hand receipts
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export function ItemSearchNoResultsState({
  includeArchived,
}: {
  includeArchived: boolean;
}) {
  return (
    <section className="rounded-lg border bg-card p-4 text-card-foreground">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
          <Archive aria-hidden="true" className="size-4" />
        </span>
        <div className="min-w-0 space-y-1">
          <h2 className="text-base font-semibold tracking-normal">
            No matching items
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Try a shorter identifier, a hand receipt name, a contact, or a
            location.{" "}
            {includeArchived
              ? "Archived hand receipts stay out of search."
              : "Turn on archived records if you are looking for preserved item history."}
          </p>
        </div>
      </div>
    </section>
  );
}
