"use client";

import { Button } from "@/components/ui/button";
import { trpc } from "@/trpc/react";
import { Active2062sEmptyState } from "./active-2062s-empty-state";
import { AssignmentList } from "./assignment-list-item";

export function Active2062sWorkspace() {
  const assignmentsQuery = trpc.assignments2062.list.useQuery();
  const assignments = assignmentsQuery.data ?? [];

  function renderContent() {
    if (assignmentsQuery.isLoading) {
      return (
        <div className="space-y-2" data-testid="active-2062s-loading">
          <div className="h-24 rounded-lg border bg-card" />
          <div className="h-24 rounded-lg border bg-card" />
          <div className="h-24 rounded-lg border bg-card" />
        </div>
      );
    }

    if (assignmentsQuery.error) {
      return (
        <div
          className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
          role="alert"
        >
          <p className="font-medium">Active 2062s could not be loaded.</p>
          <p className="leading-6">{assignmentsQuery.error.message}</p>
          <Button
            onClick={() => void assignmentsQuery.refetch()}
            size="sm"
            type="button"
            variant="outline"
          >
            Retry
          </Button>
        </div>
      );
    }

    if (assignments.length === 0) {
      return <Active2062sEmptyState />;
    }

    return <AssignmentList assignments={assignments} />;
  }

  return (
    <section className="space-y-5">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          Formal assignments
        </p>
        <h1 className="text-2xl font-semibold tracking-normal md:text-3xl">
          Active 2062s
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Review DA Form 2062 assignments that are currently active. Manual
          signed-to records stay out of this list.
        </p>
      </div>
      {renderContent()}
    </section>
  );
}
