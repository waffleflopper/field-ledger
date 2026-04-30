import { CalendarDays, ClipboardList } from "lucide-react";

import type { HandReceiptRecord } from "@/modules/hand-receipts";

function formatCreatedDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

type HandReceiptListProps = {
  handReceipts: HandReceiptRecord[];
};

export function HandReceiptList({ handReceipts }: HandReceiptListProps) {
  return (
    <div className="space-y-2">
      {handReceipts.map((handReceipt) => (
        <article
          className="rounded-lg border bg-card p-4 text-card-foreground"
          key={handReceipt.id}
        >
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
              <ClipboardList aria-hidden="true" className="size-4" />
            </span>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <h2 className="truncate text-base font-semibold tracking-normal">
                  {handReceipt.name}
                </h2>
                <span className="w-fit rounded-sm border bg-secondary px-1.5 py-0.5 font-mono text-[0.68rem] uppercase text-muted-foreground">
                  Active
                </span>
              </div>

              {handReceipt.notes ? (
                <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
                  {handReceipt.notes}
                </p>
              ) : null}

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 font-mono">
                  <CalendarDays aria-hidden="true" className="size-3.5" />
                  {formatCreatedDate(handReceipt.createdAt)}
                </span>
                {handReceipt.handReceiptNumber ? (
                  <span className="font-mono">
                    HR {handReceipt.handReceiptNumber}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
