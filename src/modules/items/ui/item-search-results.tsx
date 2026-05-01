import Link from "next/link";
import { ClipboardList, Hash, MapPin, PackageSearch, UserRound } from "lucide-react";

import type { ItemSearchResult, SearchableItemField } from "@/modules/items";

const fieldLabels: Record<SearchableItemField, string> = {
  ecn: "ECN",
  serialNumber: "Serial",
  generatedId: "Field Ledger ID",
  nomenclature: "Item",
  handReceiptName: "Hand receipt",
  contact: "Contact",
  location: "Location",
};

function getIdentifierMatches(result: ItemSearchResult) {
  const identifiers = [
    result.matchedFields.includes("ecn") && result.item.ecn
      ? `ECN ${result.item.ecn}`
      : null,
    result.matchedFields.includes("serialNumber") && result.item.serialNumber
      ? `Serial ${result.item.serialNumber}`
      : null,
    result.matchedFields.includes("generatedId") && result.item.generatedId
      ? result.item.generatedId
      : null,
  ].filter(Boolean);

  if (identifiers.length > 0) {
    return identifiers;
  }

  if (result.item.ecn) {
    return [`ECN ${result.item.ecn}`];
  }

  if (result.item.serialNumber) {
    return [`Serial ${result.item.serialNumber}`];
  }

  return result.item.generatedId ? [result.item.generatedId] : [];
}

export function ItemSearchResults({
  results,
}: {
  results: ItemSearchResult[];
}) {
  return (
    <div className="divide-y rounded-lg border bg-card">
      {results.map((result) => {
        const identifiers = getIdentifierMatches(result);

        return (
          <article
            className="flex items-start gap-3 p-3 sm:p-4"
            key={result.item.id}
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
              <PackageSearch aria-hidden="true" className="size-4" />
            </span>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <Link
                    aria-label={`Open ${result.item.nomenclature}`}
                    className="block truncate text-sm font-semibold tracking-normal underline-offset-4 hover:underline"
                    href={`/app/items/${result.item.id}`}
                  >
                    {result.item.nomenclature}
                  </Link>
                  <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <ClipboardList aria-hidden="true" className="size-3" />
                    <span className="truncate">{result.handReceipt.name}</span>
                  </div>
                </div>
                {result.item.status === "archived" ? (
                  <span className="w-fit rounded-sm border px-2 py-1 font-mono text-[0.65rem] uppercase text-muted-foreground">
                    Archived item
                  </span>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                {identifiers.map((identifier) => (
                  <span
                    className="inline-flex items-center gap-1 rounded-sm border bg-secondary px-2 py-1 font-mono text-[0.68rem] uppercase text-secondary-foreground"
                    key={identifier}
                  >
                    <Hash aria-hidden="true" className="size-3" />
                    {identifier}
                  </span>
                ))}
                {result.contact ? (
                  <span className="inline-flex items-center gap-1 rounded-sm border px-2 py-1 text-xs text-muted-foreground">
                    <UserRound aria-hidden="true" className="size-3" />
                    {result.contact.displayName}
                    <span className="font-mono text-[0.63rem] uppercase">
                      No 2062
                    </span>
                  </span>
                ) : null}
                {result.location ? (
                  <span className="inline-flex items-center gap-1 rounded-sm border px-2 py-1 text-xs text-muted-foreground">
                    <MapPin aria-hidden="true" className="size-3" />
                    {result.location.name}
                  </span>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {result.matchedFields.map((field) => (
                  <span
                    className="rounded-sm bg-secondary px-1.5 py-0.5 font-mono text-[0.63rem] uppercase text-muted-foreground"
                    key={field}
                  >
                    Matched {fieldLabels[field]}
                  </span>
                ))}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
