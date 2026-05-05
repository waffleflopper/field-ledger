import { CalendarDays, MapPin } from "lucide-react";

import type { LocationRecord } from "@/modules/locations/application/types";

function formatCreatedDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

type LocationListProps = {
  locations: LocationRecord[];
};

export function LocationList({ locations }: LocationListProps) {
  return (
    <div className="divide-y rounded-lg border bg-card text-card-foreground">
      {locations.map((location) => (
        <article
          className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-secondary/40"
          key={location.id}
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
            <MapPin aria-hidden="true" className="size-4" />
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <h2 className="truncate text-base font-semibold tracking-normal">
              {location.name}
            </h2>
            <p className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground">
              <CalendarDays aria-hidden="true" className="size-3.5" />
              Added {formatCreatedDate(location.createdAt)}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}
