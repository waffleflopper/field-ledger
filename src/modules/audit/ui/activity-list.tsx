import { Activity, Clock3 } from "lucide-react";

import type { RecentActivityItem } from "@/modules/audit";

type ActivityListProps = {
  activity: RecentActivityItem[];
  emptyDescription?: string;
  emptyTitle?: string;
  isCompact?: boolean;
  showTarget?: boolean;
};

const activityDateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatActivityDate(date: Date) {
  return activityDateFormatter.format(date);
}

export function ActivityList({
  activity,
  emptyDescription = "Events will appear here as you use Field Ledger.",
  emptyTitle = "No activity yet",
  isCompact = false,
  showTarget = true,
}: ActivityListProps) {
  if (activity.length === 0) {
    return (
      <div
        className={
          isCompact
            ? "rounded-lg border bg-card p-4 text-card-foreground"
            : "rounded-lg border bg-card p-5 text-card-foreground"
        }
      >
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
            <Activity aria-hidden="true" className="size-4" />
          </span>
          <div className="space-y-1">
            <h2 className="text-base font-semibold tracking-normal">
              {emptyTitle}
            </h2>
            <p className="max-w-xl text-sm leading-6 text-muted-foreground">
              {emptyDescription}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ol className="overflow-hidden rounded-lg border bg-card text-card-foreground">
      {activity.map((event) => (
        <li
          className={
            isCompact
              ? "flex gap-3 border-b px-3 py-2.5 last:border-b-0"
              : "flex gap-3 border-b px-4 py-3 last:border-b-0 sm:px-5"
          }
          key={event.id}
        >
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
            <Clock3 aria-hidden="true" className="size-4" />
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
              <h2 className="text-sm font-semibold tracking-normal">
                {event.label}
              </h2>
              <time
                className="font-mono text-[0.68rem] text-muted-foreground"
                dateTime={event.occurredAt.toISOString()}
              >
                {formatActivityDate(event.occurredAt)}
              </time>
            </div>
            {showTarget && event.targetLabel ? (
              <p className="text-xs leading-5 text-muted-foreground">
                {event.targetLabel}
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
