"use client";

import Link from "next/link";
import { FileText, History } from "lucide-react";

import { Button } from "@/components/ui/button";
import { trpc } from "@/trpc/react";

function formatDate(value: Date | string | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function ItemCoverageSection({
  isReadOnly,
  itemId,
  itemStatus,
  signedToContactName,
}: {
  isReadOnly: boolean;
  itemId: string;
  itemStatus: "active" | "archived";
  signedToContactName: string | null;
}) {
  const coverageQuery = trpc.assignments2062.getItemCoverage.useQuery({
    itemId,
  });
  const coverage = coverageQuery.data;
  const canUpload = itemStatus === "active" && !coverage?.current;

  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
          <FileText aria-hidden="true" className="size-4" />
        </span>
        <div className="min-w-0 flex-1 space-y-3">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold tracking-normal">
              2062 Coverage
            </h2>
            {coverageQuery.isLoading ? (
              <div className="h-20 rounded-lg border bg-secondary" />
            ) : coverageQuery.error ? (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {coverageQuery.error.message}
              </p>
            ) : coverage?.current ? (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-foreground">
                    {coverage.current.contactName}
                  </p>
                  <span className="rounded-sm border bg-secondary px-2 py-1 font-mono text-[0.68rem] uppercase text-muted-foreground">
                    DA Form 2062
                  </span>
                </div>
                <p className="break-words text-sm text-muted-foreground">
                  {coverage.current.documentFilename}
                </p>
                <p className="text-sm text-muted-foreground">
                  {coverage.current.handReceiptName} -{" "}
                  {coverage.current.itemCount}{" "}
                  {coverage.current.itemCount === 1 ? "item" : "items"}
                </p>
              </div>
            ) : signedToContactName ? (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-foreground">
                    Manual signed-to state
                  </p>
                  <span className="rounded-sm border bg-secondary px-2 py-1 font-mono text-[0.68rem] uppercase text-muted-foreground">
                    Informal
                  </span>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">
                  Manual signed-to state can be converted by uploading a formal
                  2062.
                </p>
              </div>
            ) : (
              <p className="text-sm leading-6 text-muted-foreground">
                No formal 2062 coverage is active for this item.
              </p>
            )}
          </div>

          {coverage && coverage.history.length > 0 ? (
            <div className="space-y-2 border-t pt-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                <History aria-hidden="true" className="size-4" />
                History
              </div>
              <div className="space-y-2">
                {coverage.history.map((link) => (
                  <div
                    className="rounded-md border bg-background px-3 py-2 text-sm"
                    key={link.linkId}
                  >
                    <p className="font-medium text-foreground">
                      {link.contactName}
                    </p>
                    <p className="text-muted-foreground">
                      Closed {formatDate(link.closedAt)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {canUpload && !isReadOnly ? (
            <Button asChild size="sm">
              <Link href={`/app/items/${itemId}/upload-2062`}>
                <FileText aria-hidden="true" className="size-4" />
                Upload 2062
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
