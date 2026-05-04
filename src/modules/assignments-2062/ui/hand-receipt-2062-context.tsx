"use client";

import Link from "next/link";
import { ReceiptText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { trpc } from "@/trpc/react";

export function HandReceipt2062Context({
  handReceiptId,
  isReadOnly,
  isReceiptActive,
}: {
  handReceiptId: string;
  isReadOnly: boolean;
  isReceiptActive: boolean;
}) {
  const assignmentsQuery =
    trpc.assignments2062.getHandReceiptAssignments.useQuery({
      handReceiptId,
    });
  const assignments = assignmentsQuery.data ?? [];
  const canUpload = !isReadOnly && isReceiptActive;

  return (
    <section className="space-y-3 rounded-lg border bg-card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
            <ReceiptText aria-hidden="true" className="size-4" />
          </span>
          <div className="space-y-1">
            <h2 className="text-sm font-semibold tracking-normal">
              Active 2062s
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Formal assignments tied to this hand receipt.
            </p>
          </div>
        </div>
        <Button
          asChild={canUpload}
          disabled={!canUpload}
          size="sm"
          title={
            isReadOnly
              ? "2062 creation is paused while this account is read-only."
              : isReceiptActive
                ? "Upload a 2062 for multiple items"
                : "Archived hand receipts cannot receive new 2062 assignments."
          }
          type="button"
          variant="outline"
        >
          {canUpload ? (
            <Link href={`/app/hand-receipts/${handReceiptId}/upload-2062`}>
              Upload 2062
            </Link>
          ) : (
            <>Upload 2062</>
          )}
        </Button>
      </div>

      {assignmentsQuery.isLoading ? (
        <div className="h-24 rounded-lg border bg-secondary" />
      ) : assignmentsQuery.error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {assignmentsQuery.error.message}
        </p>
      ) : assignments.length === 0 ? (
        <p className="rounded-lg border bg-background px-3 py-2 text-sm leading-6 text-muted-foreground">
          No active 2062 assignments for this hand receipt.
        </p>
      ) : (
        <div className="divide-y rounded-lg border bg-background">
          {assignments.map((assignment) => (
            <div
              className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
              key={assignment.id}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {assignment.contactName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {assignment.itemCount}{" "}
                  {assignment.itemCount === 1 ? "item" : "items"} covered
                </p>
              </div>
              <Button asChild size="sm" variant="ghost">
                <Link href="/app/active-2062s">View</Link>
              </Button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
