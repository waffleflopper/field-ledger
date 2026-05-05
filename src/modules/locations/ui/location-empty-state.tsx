import { MapPin } from "lucide-react";

type LocationEmptyStateProps = {
  canCreate: boolean;
};

export function LocationEmptyState({ canCreate }: LocationEmptyStateProps) {
  return (
    <div className="rounded-lg border bg-card p-5 text-card-foreground">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
          <MapPin aria-hidden="true" className="size-5" />
        </span>
        <div className="max-w-2xl space-y-2">
          <h2 className="text-base font-semibold tracking-normal">
            No reusable locations yet
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Locations are account-wide names you can reuse when placing items
            across hand receipts.
          </p>
          {canCreate ? (
            <p className="text-sm font-medium text-primary">
              Use New location to add the first name-only place.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
