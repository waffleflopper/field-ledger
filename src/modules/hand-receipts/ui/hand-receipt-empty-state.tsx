import { ClipboardList } from "lucide-react";

type HandReceiptEmptyStateProps = {
  canCreate: boolean;
};

export function HandReceiptEmptyState({
  canCreate,
}: HandReceiptEmptyStateProps) {
  return (
    <div className="rounded-lg border bg-card p-5 text-card-foreground">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
          <ClipboardList aria-hidden="true" className="size-5" />
        </span>
        <div className="max-w-2xl space-y-2">
          <h2 className="text-base font-semibold tracking-normal">
            Start with one named hand receipt
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Hand receipts are the buckets Field Ledger uses to organize property
            before items, 2062s, and requirements are added.
          </p>
          {canCreate ? (
            <p className="text-sm font-medium text-primary">
              Use New hand receipt to create the first active record.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
