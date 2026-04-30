import { Activity, Clock3 } from "lucide-react";

import type { RecentActivityItem } from "@/modules/audit";

type ActivityListProps = {
  activity: RecentActivityItem[];
};

const activityDateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatActivityDate(date: Date) {
  return activityDateFormatter.format(date);
}

export function ActivityList({ activity }: ActivityListProps) {
  if (activity.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-5 text-card-foreground">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
            <Activity aria-hidden="true" className="size-4" />
          </span>
          <div className="space-y-1">
            <h2 className="text-base font-semibold tracking-normal">
              No activity yet
            </h2>
            <p className="max-w-xl text-sm leading-6 text-muted-foreground">
              Events will appear here as you use Field Ledger.
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
          className="flex gap-3 border-b px-4 py-3 last:border-b-0 sm:px-5"
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
            {event.targetType ? (
              <p className="font-mono text-[0.68rem] uppercase tracking-normal text-muted-foreground">
                {event.targetType}
                {event.targetId ? ` ${event.targetId}` : ""}
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
