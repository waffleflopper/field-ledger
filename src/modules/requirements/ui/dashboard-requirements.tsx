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
  return dateFormatter.format(new Date(`${value}T00:00:00.000Z`));
}

function statusClasses(urgency: DashboardRequirementRow["urgency"]) {
  if (urgency === "overdue") {
    return "border-red-900/30 bg-red-900/5 text-red-900";
  }

  if (urgency === "due_soon") {
    return "border-amber-800/30 bg-amber-800/5 text-amber-900";
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
        className="grid min-h-20 gap-2 rounded-md border bg-card px-3 py-3 text-card-foreground transition-colors hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:grid-cols-[1fr_auto]"
        href={`/app/items/${row.itemId}`}
      >
        <span className="min-w-0 space-y-1">
          <span className="block truncate text-sm font-semibold tracking-normal">
            {row.requirementName}
          </span>
          <span className="block truncate text-sm text-muted-foreground">
            {row.itemNomenclature}
          </span>
          <span className="block truncate text-xs font-medium text-muted-foreground">
            {row.handReceiptName}
          </span>
        </span>
        <span className="flex items-center gap-2 sm:flex-col sm:items-end sm:justify-center">
          <span
            className={cn(
              "rounded-[3px] border px-2 py-1 text-[0.6875rem] font-bold uppercase tracking-[0.06em]",
              statusClasses(row.urgency),
            )}
          >
            {label}
          </span>
          <span className="font-mono text-[0.6875rem] text-muted-foreground">
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
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold tracking-normal">{title}</h3>
          <p className="text-xs text-muted-foreground">{windowLabel}</p>
        </div>
        <span className="rounded-[3px] border bg-secondary px-2 py-0.5 font-mono text-[0.6875rem] text-muted-foreground">
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
        <p className="rounded-md border border-dashed bg-secondary/50 px-3 py-3 text-sm text-muted-foreground">
          No active requirement work in this window.
        </p>
      )}
    </section>
  );
}

function DashboardRequirementsEmpty() {
  return (
    <div className="rounded-lg border bg-card p-4 text-card-foreground">
      <h3 className="text-base font-semibold tracking-normal">
        No requirements need attention
      </h3>
      <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
        Active item requirements due in the next 30 days will appear here.
      </p>
    </div>
  );
}

function DashboardReadOnlyNotice() {
  return (
    <div className="rounded-lg border border-amber-800/30 bg-amber-800/5 p-4 text-card-foreground">
      <h3 className="text-base font-semibold tracking-normal">
        Account is read-only
      </h3>
      <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
        Requirement records remain available from item detail, but the dashboard
        is not presenting them as active operational reminders.
      </p>
    </div>
  );
}

export function DashboardRequirements(props: DashboardRequirementsProps) {
  const hasRequirements =
    props.overdue.length + props.dueSoon.length + props.upcoming.length > 0;

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-base font-semibold tracking-normal">
          Requirements
        </h2>
        <p className="text-sm text-muted-foreground">
          Overdue, due soon, then upcoming item work.
        </p>
      </div>
      {props.isReadOnly ? (
        <DashboardReadOnlyNotice />
      ) : hasRequirements ? (
        <div className="grid gap-4 xl:grid-cols-3">
          <DashboardRequirementsSection
            rows={props.overdue}
            title="Overdue"
            windowLabel="Before today"
          />
          <DashboardRequirementsSection
            rows={props.dueSoon}
            title="Due Soon"
            windowLabel="Today through 14 days"
          />
          <DashboardRequirementsSection
            rows={props.upcoming}
            title="Upcoming"
            windowLabel="15 through 30 days"
          />
        </div>
      ) : (
        <DashboardRequirementsEmpty />
      )}
    </section>
  );
}
