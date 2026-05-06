import Link from "next/link";

import type {
  DashboardRequirementRow,
  DashboardRequirementsResult,
} from "@/modules/requirements";
import { cn } from "@/lib/utils";

type DashboardRequirementsProps = DashboardRequirementsResult & {
  isReadOnly: boolean;
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return dateFormatter.format(date);
}

function statusClasses(urgency: DashboardRequirementRow["urgency"]) {
  if (urgency === "overdue") {
    return "border-destructive/30 bg-destructive/5 text-destructive";
  }

  if (urgency === "due_soon") {
    return "border-chart-2/30 bg-chart-2/5 text-chart-2";
  }

  return "border-border bg-secondary text-muted-foreground";
}

function DashboardRequirementRowView({
  row,
}: {
  row: DashboardRequirementRow;
}) {
  const label =
    row.urgency === "overdue"
      ? "Overdue"
      : row.urgency === "due_soon"
        ? "Due Soon"
        : "Upcoming";

  return (
    <li>
      <Link
        className="group grid min-h-20 gap-3 rounded-md border bg-card px-3 py-3 text-card-foreground transition-colors hover:border-primary/30 hover:bg-secondary/50 active:bg-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:grid-cols-[minmax(0,1fr)_auto]"
        href={`/app/items/${row.itemId}`}
      >
        <span className="min-w-0 space-y-1">
          <span className="block truncate text-sm font-semibold tracking-normal group-hover:text-primary">
            {row.requirementName}
          </span>
          <span className="block truncate text-sm text-muted-foreground">
            {row.itemNomenclature}
          </span>
          <span className="block truncate font-mono text-[0.6875rem] text-muted-foreground">
            {row.handReceiptName}
          </span>
        </span>
        <span className="flex min-w-0 items-center gap-2 sm:flex-col sm:items-end sm:justify-center">
          <span
            className={cn(
              "max-w-full rounded-[3px] border px-2 py-1 text-[0.6875rem] font-bold uppercase tracking-[0.06em]",
              statusClasses(row.urgency),
            )}
          >
            {label}
          </span>
          <span className="font-mono text-[0.6875rem] tabular-nums text-muted-foreground">
            {formatDate(row.nextDueDate)}
          </span>
        </span>
      </Link>
    </li>
  );
}

function DashboardRequirementsSection({
  rows,
  title,
  windowLabel,
}: {
  rows: DashboardRequirementRow[];
  title: string;
  windowLabel: string;
}) {
  return (
    <section className="space-y-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold tracking-normal">{title}</h3>
          <p className="text-xs text-muted-foreground">{windowLabel}</p>
        </div>
        <span
          aria-label={`${rows.length} requirements`}
          className="shrink-0 rounded-[3px] border bg-secondary px-2 py-0.5 font-mono text-[0.6875rem] text-muted-foreground"
        >
          {rows.length}
        </span>
      </div>
      {rows.length > 0 ? (
        <ul className="space-y-2">
          {rows.map((row) => (
            <DashboardRequirementRowView key={row.requirementId} row={row} />
          ))}
        </ul>
      ) : (
        <p className="rounded-md border border-dashed bg-secondary/50 px-3 py-3 text-sm leading-6 text-muted-foreground">
          No active requirement work in this window.
        </p>
      )}
    </section>
  );
}

function requirementCountLabel(count: number) {
  return count === 1 ? "1 requirement" : `${count} requirements`;
}

function DashboardRequirementsPriority({
  dueSoonCount,
  immediateCount,
  overdueCount,
  totalCount,
  upcomingCount,
}: {
  dueSoonCount: number;
  immediateCount: number;
  overdueCount: number;
  totalCount: number;
  upcomingCount: number;
}) {
  const summary =
    overdueCount > 0
      ? `${requirementCountLabel(overdueCount)} overdue`
      : dueSoonCount > 0
        ? `${requirementCountLabel(dueSoonCount)} due soon`
        : "No overdue or due-soon requirements";

  return (
    <div className="rounded-lg border bg-card p-3 text-card-foreground sm:p-4">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.06em] text-muted-foreground">
            What needs attention first
          </p>
          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-normal md:text-2xl">
              {summary}
            </h2>
            <p className="max-w-xl text-sm leading-6 text-muted-foreground">
              Open the most urgent item first, then work through what is due
              soon.
            </p>
          </div>
        </div>
        <div className="grid min-w-0 grid-cols-2 overflow-hidden rounded-md border bg-secondary/50 text-center">
          <div className="border-r px-3 py-2">
            <p className="font-mono text-base font-semibold tabular-nums text-destructive">
              {overdueCount}
            </p>
            <p className="mt-0.5 text-[0.6875rem] font-bold uppercase tracking-[0.06em] text-muted-foreground">
              Overdue
            </p>
          </div>
          <div className="px-3 py-2">
            <p className="font-mono text-base font-semibold tabular-nums text-chart-2">
              {dueSoonCount}
            </p>
            <p className="mt-0.5 text-[0.6875rem] font-bold uppercase tracking-[0.06em] text-muted-foreground">
              Due Soon
            </p>
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-1 border-t pt-3 font-mono text-[0.6875rem] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>{requirementCountLabel(immediateCount)} to handle now</span>
        <span>
          {requirementCountLabel(upcomingCount)} planning item
          {upcomingCount === 1 ? "" : "s"} in the 30-day window
        </span>
        <span>{requirementCountLabel(totalCount)} total in view</span>
      </div>
    </div>
  );
}

function DashboardRequirementsEmpty() {
  return (
    <div className="rounded-lg border bg-card p-4 text-card-foreground">
      <div className="space-y-2">
        <h3 className="text-base font-semibold tracking-normal">
          No requirements need attention
        </h3>
        <p className="max-w-xl text-sm leading-6 text-muted-foreground">
          Nothing is overdue or due soon. Check item detail when you need to add
          or adjust a requirement.
        </p>
      </div>
      <div className="mt-3 flex flex-wrap gap-3 border-t pt-3 text-sm font-medium">
        <Link
          className="rounded-sm text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          href="/app/items"
        >
          Review items
        </Link>
        <Link
          className="rounded-sm text-muted-foreground underline-offset-4 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          href="/app/activity"
        >
          Check recent changes
        </Link>
      </div>
    </div>
  );
}

function DashboardReadOnlyNotice() {
  return (
    <div className="rounded-lg border border-chart-2/30 bg-chart-2/5 p-4 text-card-foreground">
      <h3 className="text-base font-semibold tracking-normal">
        Account is read-only
      </h3>
      <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
        You can review requirement records from item detail, but this account
        cannot record active requirement work.
      </p>
    </div>
  );
}

export function DashboardRequirements(props: DashboardRequirementsProps) {
  const sections = [
    {
      rows: props.overdue,
      title: "Overdue",
      windowLabel: "Handle first",
    },
    {
      rows: props.dueSoon,
      title: "Due Soon",
      windowLabel: "Due within 14 days",
    },
    {
      rows: props.upcoming,
      title: "Plan Ahead",
      windowLabel: "Due in 15 to 30 days",
    },
  ];
  const hasRequirements =
    props.overdue.length + props.dueSoon.length + props.upcoming.length > 0;

  return (
    <section className="space-y-4">
      {props.isReadOnly ? (
        <DashboardReadOnlyNotice />
      ) : hasRequirements ? (
        <>
          <DashboardRequirementsPriority
            dueSoonCount={props.dueSoon.length}
            immediateCount={props.overdue.length + props.dueSoon.length}
            overdueCount={props.overdue.length}
            totalCount={
              props.overdue.length +
              props.dueSoon.length +
              props.upcoming.length
            }
            upcomingCount={props.upcoming.length}
          />
          <div className="grid gap-5 xl:grid-cols-3">
            {sections.map((section) => (
              <DashboardRequirementsSection
                key={section.title}
                rows={section.rows}
                title={section.title}
                windowLabel={section.windowLabel}
              />
            ))}
          </div>
        </>
      ) : (
        <DashboardRequirementsEmpty />
      )}
    </section>
  );
}
