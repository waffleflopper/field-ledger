import Link from "next/link";
import { CalendarDays, ClipboardList, ReceiptText } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ActiveAssignmentSummary } from "@/modules/assignments-2062";

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function AssignmentList({
  assignments,
}: {
  assignments: ActiveAssignmentSummary[];
}) {
  return (
    <div className="divide-y rounded-lg border bg-card text-card-foreground">
      {assignments.map((assignment) => (
        <article
          className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
          key={assignment.id}
        >
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
              <ReceiptText aria-hidden="true" className="size-4" />
            </span>
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-semibold tracking-normal">
                  {assignment.contactName}
                </h2>
                <span className="rounded-sm border bg-secondary px-2 py-1 font-mono text-[0.68rem] uppercase text-muted-foreground">
                  Active
                </span>
                <span className="rounded-sm border bg-secondary px-2 py-1 font-mono text-[0.68rem] uppercase text-muted-foreground">
                  {assignment.itemCount}{" "}
                  {assignment.itemCount === 1 ? "item" : "items"}
                </span>
              </div>
              <div className="flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                <span className="inline-flex min-w-0 items-center gap-1.5">
                  <ClipboardList
                    aria-hidden="true"
                    className="size-4 shrink-0"
                  />
                  <span className="truncate">{assignment.handReceiptName}</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays
                    aria-hidden="true"
                    className="size-4 shrink-0"
                  />
                  Created {formatDate(assignment.createdAt)}
                </span>
              </div>
              <p className="break-words text-sm text-muted-foreground">
                {assignment.documentFilename}
              </p>
            </div>
          </div>
          <Button asChild className="w-full sm:w-auto" size="sm">
            <Link href={`/app/hand-receipts/${assignment.handReceiptId}`}>
              Open context
            </Link>
          </Button>
        </article>
      ))}
    </div>
  );
}
