import { UserRound } from "lucide-react";

type ContactEmptyStateProps = {
  canCreate: boolean;
};

export function ContactEmptyState({ canCreate }: ContactEmptyStateProps) {
  return (
    <div className="rounded-lg border bg-card p-5 text-card-foreground">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
          <UserRound aria-hidden="true" className="size-5" />
        </span>
        <div className="max-w-2xl space-y-2">
          <h2 className="text-base font-semibold tracking-normal">
            No reusable assignees yet
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Contacts are account-wide names you can reuse for manual signed-to
            state and formal 2062 assignments.
          </p>
          {canCreate ? (
            <p className="text-sm font-medium text-primary">
              Use New contact to add the first display-name-only assignee.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
