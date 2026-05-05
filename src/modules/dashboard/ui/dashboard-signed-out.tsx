import { ClipboardList, ReceiptText } from "lucide-react";
import Link from "next/link";

import type {
  DashboardSignedOutResult,
  DashboardSignedOutRow,
} from "@/modules/items";
import { cn } from "@/lib/utils";

type DashboardSignedOutProps = DashboardSignedOutResult & {
  isReadOnly: boolean;
};

function coverageBadgeClasses(
  coverageType: DashboardSignedOutRow["coverageType"],
) {
  return cn(
    "rounded-[3px] border px-2 py-1 text-[0.6875rem] font-bold uppercase tracking-[0.06em]",
    coverageType === "da2062"
      ? "border-emerald-900/30 bg-emerald-900/5 text-emerald-900"
      : "border-amber-800/30 bg-amber-800/5 text-amber-900",
  );
}

function DashboardSignedOutRowView({ row }: { row: DashboardSignedOutRow }) {
  const label = row.coverageType === "da2062" ? "DA 2062" : "No 2062";

  return (
    <li>
      <Link
        className="grid min-h-20 gap-2 rounded-md border bg-card px-3 py-3 text-card-foreground transition-colors hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:grid-cols-[1fr_auto]"
        href={`/app/items/${row.itemId}`}
      >
        <span className="min-w-0 space-y-1">
          <span className="block truncate text-sm font-semibold tracking-normal">
            {row.nomenclature}
          </span>
          <span className="block truncate text-sm text-muted-foreground">
            Signed to {row.signedToName}
          </span>
          <span className="block truncate text-xs font-medium text-muted-foreground">
            {row.handReceiptName} · {row.identifier}
          </span>
        </span>
        <span className="flex items-center gap-2 sm:flex-col sm:items-end sm:justify-center">
          <span className={coverageBadgeClasses(row.coverageType)}>
            {label}
          </span>
          {row.documentFilename ? (
            <span className="max-w-36 truncate text-[0.6875rem] text-muted-foreground">
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
        <span className="rounded-[3px] border bg-secondary px-2 py-0.5 font-mono text-[0.6875rem] text-muted-foreground">
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
      <h3 className="text-base font-semibold tracking-normal">
        No signed-out property
      </h3>
      <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
        Items assigned by DA 2062 or manual signed-to state will appear here.
        {isReadOnly
          ? " This account is read-only, so this is review-only."
          : ""}
      </p>
    </div>
  );
}

function DashboardSignedOutReadOnlyNotice() {
  return (
    <div className="rounded-lg border border-amber-800/30 bg-amber-800/5 p-4 text-card-foreground">
      <h3 className="text-base font-semibold tracking-normal">
        Review-only signed-out state
      </h3>
      <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
        This account can still review formal 2062 coverage and manual signed-to
        property, but the dashboard is not showing write actions.
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
            Signed-Out Property
          </h2>
        </div>
        {hasSignedOut ? (
          <Link
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
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
        <div className="grid gap-4 lg:grid-cols-2">
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
              title="Manual"
            />
          ) : null}
        </div>
      ) : (
        <DashboardSignedOutEmpty isReadOnly={props.isReadOnly} />
      )}
    </section>
  );
}
