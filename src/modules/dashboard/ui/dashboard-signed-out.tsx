import { ClipboardList, ReceiptText } from "lucide-react";
import Link from "next/link";

import type {
  DashboardSignedOutResult,
  DashboardSignedOutRow,
} from "@/modules/items";
import { cn } from "@/lib/utils";

type DashboardSignedOutProps = DashboardSignedOutResult & {
  isReadOnly: boolean;
  layout?: "full" | "rail";
};

function coverageBadgeClasses(
  coverageType: DashboardSignedOutRow["coverageType"],
) {
  return cn(
    "rounded-[3px] border px-2 py-1 text-[0.6875rem] font-bold uppercase tracking-[0.06em]",
    coverageType === "da2062"
      ? "border-chart-4/30 bg-chart-4/5 text-chart-4"
      : "border-chart-2/30 bg-chart-2/5 text-chart-2",
  );
}

function DashboardSignedOutRowView({ row }: { row: DashboardSignedOutRow }) {
  const label = row.coverageType === "da2062" ? "DA 2062" : "No 2062";

  return (
    <li>
      <Link
        className="group grid min-h-20 gap-3 rounded-md border bg-card px-3 py-3 text-card-foreground transition-colors hover:border-primary/30 hover:bg-secondary/50 active:bg-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:grid-cols-[minmax(0,1fr)_auto]"
        href={`/app/items/${row.itemId}`}
      >
        <span className="min-w-0 space-y-1">
          <span className="block truncate text-sm font-semibold tracking-normal group-hover:text-primary">
            {row.nomenclature}
          </span>
          <span className="block truncate text-sm text-muted-foreground">
            Assigned to {row.signedToName}
          </span>
          <span className="block truncate font-mono text-[0.6875rem] text-muted-foreground">
            {row.handReceiptName} · {row.identifier}
          </span>
        </span>
        <span className="flex min-w-0 items-center gap-2 sm:flex-col sm:items-end sm:justify-center">
          <span className={coverageBadgeClasses(row.coverageType)}>
            {label}
          </span>
          {row.documentFilename ? (
            <span
              className="max-w-full truncate text-[0.6875rem] text-muted-foreground sm:max-w-36"
              title={row.documentFilename}
            >
              {row.documentFilename}
            </span>
          ) : null}
        </span>
      </Link>
    </li>
  );
}

function DashboardSignedOutSection({
  icon: Icon,
  rows,
  title,
}: {
  icon: typeof ReceiptText;
  rows: DashboardSignedOutRow[];
  title: string;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-sm font-semibold tracking-normal">
            <Icon aria-hidden="true" className="size-4 text-primary" />
            {title}
          </h3>
        </div>
        <span
          aria-label={`${rows.length} items`}
          className="shrink-0 rounded-[3px] border bg-secondary px-2 py-0.5 font-mono text-[0.6875rem] text-muted-foreground"
        >
          {rows.length}
        </span>
      </div>
      <ul className="space-y-2">
        {rows.map((row) => (
          <DashboardSignedOutRowView key={row.itemId} row={row} />
        ))}
      </ul>
    </section>
  );
}

function DashboardSignedOutEmpty({ isReadOnly }: { isReadOnly: boolean }) {
  return (
    <div className="rounded-lg border bg-card p-4 text-card-foreground">
      <div className="space-y-2">
        <h3 className="text-base font-semibold tracking-normal">
          No signed-out property
        </h3>
        <p className="max-w-xl text-sm leading-6 text-muted-foreground">
          Property assigned out by DA 2062 or without a 2062 will appear here.
          {isReadOnly
            ? " This account is read-only, so this section is for review."
            : " Open an item detail page when property leaves your hand receipt."}
        </p>
      </div>
      {isReadOnly ? null : (
        <div className="mt-3 border-t pt-3 text-sm font-medium">
          <Link
            className="rounded-sm text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            href="/app/items"
          >
            Find an item
          </Link>
        </div>
      )}
    </div>
  );
}

function DashboardSignedOutReadOnlyNotice() {
  return (
    <div className="rounded-lg border border-chart-2/30 bg-chart-2/5 p-4 text-card-foreground">
      <h3 className="text-base font-semibold tracking-normal">
        Signed-out property is review-only
      </h3>
      <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
        You can review DA 2062 coverage and no-2062 assignments, but this
        account cannot change signed-out property from the dashboard.
      </p>
    </div>
  );
}

export function DashboardSignedOut(props: DashboardSignedOutProps) {
  const hasSignedOut = props.manualItems.length + props.coveredItems.length > 0;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-normal">
            Signed-out property
          </h2>
        </div>
        {hasSignedOut ? (
          <Link
            className="rounded-sm text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            href="/app/items"
          >
            View all
          </Link>
        ) : null}
      </div>
      {props.isReadOnly && hasSignedOut ? (
        <DashboardSignedOutReadOnlyNotice />
      ) : null}
      {hasSignedOut ? (
        <div
          className={cn(
            "grid gap-4",
            props.layout === "rail" ? "" : "lg:grid-cols-2",
          )}
        >
          {props.coveredItems.length > 0 ? (
            <DashboardSignedOutSection
              icon={ReceiptText}
              rows={props.coveredItems}
              title="DA 2062"
            />
          ) : null}
          {props.manualItems.length > 0 ? (
            <DashboardSignedOutSection
              icon={ClipboardList}
              rows={props.manualItems}
              title="No 2062"
            />
          ) : null}
        </div>
      ) : (
        <DashboardSignedOutEmpty isReadOnly={props.isReadOnly} />
      )}
    </section>
  );
}
