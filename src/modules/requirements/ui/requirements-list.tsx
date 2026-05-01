"use client";

import { useState, type FormEvent } from "react";
import {
  CalendarCheck,
  CalendarClock,
  History,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  toLocalDateOnly,
  type RequirementRecord,
} from "@/modules/requirements";
import { trpc } from "@/trpc/react";
import { CreateRequirementForm } from "./create-requirement-form";

type RequirementsListProps = {
  itemId: string;
  isReadOnly: boolean;
  isItemActive: boolean;
};

const intervalLabels: Record<RequirementRecord["intervalType"], string> = {
  annual: "Annual",
  custom_days: "Custom days",
  custom_months: "Custom months",
  monthly: "Monthly",
  quarterly: "Quarterly",
  semiannual: "Semiannual",
  weekly: "Weekly",
};

function parseDateOnly(value: string) {
  return new Date(`${value}T00:00:00`);
}

function formatDateOnly(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parseDateOnly(value));
}

function formatInterval(requirement: RequirementRecord) {
  if (requirement.intervalType === "custom_days") {
    return `Every ${requirement.intervalValue} days`;
  }

  if (requirement.intervalType === "custom_months") {
    return `Every ${requirement.intervalValue} months`;
  }

  return intervalLabels[requirement.intervalType];
}

function todayDateOnly() {
  return toLocalDateOnly(new Date());
}

function dueTone(nextDueDate: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = parseDateOnly(nextDueDate);
  const daysUntilDue = Math.round(
    (dueDate.getTime() - today.getTime()) / 86_400_000,
  );

  if (daysUntilDue < 0) {
    return {
      label: "Overdue",
      className: "border-destructive/40 text-destructive",
    };
  }

  if (daysUntilDue <= 14) {
    return {
      label: "Due soon",
      className: "border-amber-700/40 text-amber-800",
    };
  }

  return {
    label: "Active",
    className: "border-border text-muted-foreground",
  };
}

export function RequirementsList({
  itemId,
  isReadOnly,
  isItemActive,
}: RequirementsListProps) {
  const requirementsQuery = trpc.requirements.list.useQuery({ itemId });

  if (requirementsQuery.isLoading) {
    return (
      <div className="space-y-2" aria-label="Loading requirements">
        <div className="h-14 rounded-lg border bg-secondary" />
        <div className="h-14 rounded-lg border bg-secondary" />
      </div>
    );
  }

  if (requirementsQuery.error) {
    return (
      <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
        {requirementsQuery.error.message}
      </p>
    );
  }

  const requirements = requirementsQuery.data ?? [];

  if (requirements.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-secondary/60 px-4 py-5">
        <div className="flex items-start gap-3">
          <ShieldCheck
            aria-hidden="true"
            className="mt-0.5 size-4 text-muted-foreground"
          />
          <div className="space-y-1">
            <p className="text-sm font-semibold tracking-normal">
              No active requirements
            </p>
            <p className="text-sm leading-6 text-muted-foreground">
              Add the first recurring obligation for this item when there is a
              maintenance, inspection, calibration, or replacement cadence to
              track.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border rounded-lg border bg-background">
      {requirements.map((requirement) => {
        const tone = dueTone(requirement.nextDueDate);

        return (
          <article
            className="grid gap-3 px-3 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
            key={requirement.id}
          >
            <div className="min-w-0 space-y-1">
              <h3 className="truncate text-sm font-semibold tracking-normal">
                {requirement.name}
              </h3>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>{formatInterval(requirement)}</span>
                <span aria-hidden="true">/</span>
                <span className="font-mono">
                  Due {formatDateOnly(requirement.nextDueDate)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <span
                  className={`inline-flex h-6 items-center rounded-md border px-2 font-mono text-[0.68rem] uppercase ${tone.className}`}
                >
                  {tone.label}
                </span>
                <span className="inline-flex h-6 items-center rounded-md border px-2 font-mono text-[0.68rem] uppercase text-muted-foreground">
                  {requirement.status}
                </span>
                <CompleteRequirementDialog
                  isDisabled={isReadOnly || !isItemActive}
                  itemId={itemId}
                  requirement={requirement}
                />
              </div>
            </div>
            <div className="sm:col-span-2">
              <RequirementCompletionHistory requirementId={requirement.id} />
            </div>
          </article>
        );
      })}
    </div>
  );
}

export function RequirementsPanel({
  itemId,
  isReadOnly,
  isItemActive,
}: RequirementsListProps & { isReadOnly: boolean; isItemActive: boolean }) {
  return (
    <section className="rounded-lg border bg-card p-4 text-card-foreground">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
            <CalendarClock aria-hidden="true" className="size-4" />
          </span>
          <div className="min-w-0 space-y-1">
            <h2 className="text-sm font-semibold tracking-normal">
              Requirements
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Item-level recurring obligations and date-only next due context.
            </p>
          </div>
        </div>
        <CreateRequirementSlot
          isItemActive={isItemActive}
          isReadOnly={isReadOnly}
          itemId={itemId}
        />
      </div>
      <RequirementsList
        isItemActive={isItemActive}
        isReadOnly={isReadOnly}
        itemId={itemId}
      />
    </section>
  );
}

function CreateRequirementSlot({
  itemId,
  isReadOnly,
  isItemActive,
}: {
  itemId: string;
  isReadOnly: boolean;
  isItemActive: boolean;
}) {
  return (
    <CreateRequirementForm
      isItemActive={isItemActive}
      isReadOnly={isReadOnly}
      itemId={itemId}
    />
  );
}

function CompleteRequirementDialog({
  requirement,
  itemId,
  isDisabled,
}: {
  requirement: RequirementRecord;
  itemId: string;
  isDisabled: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [completedOn, setCompletedOn] = useState(todayDateOnly());
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const utilities = trpc.useUtils();
  const completeMutation = trpc.requirements.complete.useMutation({
    onSuccess: async () => {
      setIsOpen(false);
      setError(null);
      setNotes("");
      setCompletedOn(todayDateOnly());
      await Promise.all([
        utilities.requirements.list.invalidate({ itemId }),
        utilities.requirements.listCompletionHistory.invalidate({
          requirementId: requirement.id,
        }),
        utilities.audit.listRecentActivity.invalidate(),
        utilities.audit.listTargetActivity.invalidate({
          targetType: "item",
          targetId: itemId,
        }),
      ]);
    },
    onError: (mutationError) => {
      setError(mutationError.message);
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    completeMutation.mutate({
      requirementId: requirement.id,
      completedOn,
      notes,
    });
  }

  return (
    <>
      <Button
        disabled={isDisabled}
        onClick={() => {
          setCompletedOn(todayDateOnly());
          setError(null);
          setIsOpen(true);
        }}
        size="sm"
        type="button"
        variant="outline"
      >
        <CalendarCheck aria-hidden="true" className="size-4" />
        Complete
      </Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete requirement</DialogTitle>
            <DialogDescription>
              Record completion history for {requirement.name}. The next due
              date recalculates from the completion date.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`completed-on-${requirement.id}`}>
                  Completion date
                </Label>
                <Input
                  id={`completed-on-${requirement.id}`}
                  max={todayDateOnly()}
                  onChange={(event) => setCompletedOn(event.target.value)}
                  type="date"
                  value={completedOn}
                />
              </div>
              <div className="space-y-2">
                <Label>Current next due</Label>
                <div className="flex h-8 items-center rounded-lg border bg-secondary px-2.5 font-mono text-sm text-muted-foreground">
                  {formatDateOnly(requirement.nextDueDate)}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`completion-notes-${requirement.id}`}>
                Notes
              </Label>
              <Textarea
                id={`completion-notes-${requirement.id}`}
                maxLength={500}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Optional"
                value={notes}
              />
            </div>

            {error ? (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
                {error}
              </p>
            ) : null}

            <DialogFooter>
              <Button
                disabled={completeMutation.isPending}
                onClick={() => setIsOpen(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button disabled={completeMutation.isPending} type="submit">
                {completeMutation.isPending ? "Recording" : "Record completion"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function RequirementCompletionHistory({
  requirementId,
}: {
  requirementId: string;
}) {
  const historyQuery = trpc.requirements.listCompletionHistory.useQuery({
    requirementId,
  });
  const history = historyQuery.data ?? [];

  if (historyQuery.isLoading) {
    return <div className="mt-1 h-8 rounded-md border bg-secondary/70" />;
  }

  if (history.length === 0) {
    return (
      <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
        <History aria-hidden="true" className="size-3.5" />
        No completion history yet.
      </p>
    );
  }

  return (
    <div className="mt-1 rounded-md border bg-secondary/50 px-3 py-2">
      <div className="mb-1 flex items-center gap-2 font-mono text-[0.68rem] uppercase text-muted-foreground">
        <History aria-hidden="true" className="size-3.5" />
        Recent completions
      </div>
      <div className="space-y-1">
        {history.slice(0, 3).map((completion) => (
          <div
            className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-[7.5rem_minmax(0,1fr)]"
            key={completion.id}
          >
            <span className="font-mono">
              {formatDateOnly(completion.completedOn)}
            </span>
            <span className="truncate">
              {completion.notes || "No notes recorded"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
