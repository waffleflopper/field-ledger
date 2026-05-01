import Link from "next/link";
import { Hash, PackageSearch } from "lucide-react";

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

export function ItemList({ items }: { items: ItemRecord[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
        Add the first physical item for this hand receipt when you are ready to
        track accountable property.
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
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
