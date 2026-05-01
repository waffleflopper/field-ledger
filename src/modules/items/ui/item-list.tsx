import Link from "next/link";
import { Hash, PackageSearch, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ItemRecord } from "@/modules/items";

function getPrimaryIdentifier(item: ItemRecord) {
  if (item.ecn) {
    return `ECN ${item.ecn}`;
  }

  if (item.serialNumber) {
    return `Serial ${item.serialNumber}`;
  }

  return item.generatedId ?? "No identifier";
}

export function ItemList({
  canRestore = false,
  emptyDescription = "Add the first physical item for this hand receipt when you are ready to track accountable property.",
  items,
  onRestore,
  restorePendingId = null,
}: {
  canRestore?: boolean;
  emptyDescription?: string;
  items: ItemRecord[];
  onRestore?: (item: ItemRecord) => void;
  restorePendingId?: string | null;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
        {emptyDescription}
      </div>
    );
  }

  return (
    <div className="divide-y rounded-lg border bg-card">
      {items.map((item) => (
        <article
          className="flex items-start gap-3 p-3 sm:items-center"
          key={item.id}
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
            <PackageSearch aria-hidden="true" className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <Link
              aria-label={`Open ${item.nomenclature}`}
              className="block truncate text-sm font-semibold tracking-normal underline-offset-4 hover:underline"
              href={`/app/hand-receipts/${item.handReceiptId}/items/${item.id}`}
            >
              {item.nomenclature}
            </Link>
            <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1 font-mono">
                <Hash aria-hidden="true" className="size-3" />
                {getPrimaryIdentifier(item)}
              </span>
              {item.notes ? (
                <span className="truncate">{item.notes}</span>
              ) : null}
              {item.signedToContactName ? (
                <span className="inline-flex items-center gap-1">
                  Signed to {item.signedToContactName}
                  <span className="rounded-sm border px-1 font-mono text-[0.63rem] uppercase">
                    No 2062
                  </span>
                </span>
              ) : null}
            </div>
          </div>
          {canRestore && item.status === "archived" && onRestore ? (
            <Button
              disabled={restorePendingId === item.id}
              onClick={() => onRestore(item)}
              size="sm"
              type="button"
              variant="outline"
            >
              <RotateCcw aria-hidden="true" className="size-4" />
              {restorePendingId === item.id ? "Restoring" : "Restore"}
            </Button>
          ) : null}
        </article>
      ))}
    </div>
  );
}
