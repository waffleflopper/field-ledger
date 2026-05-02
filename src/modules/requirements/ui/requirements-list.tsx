"use client";

import { useState, type FormEvent } from "react";
import {
  CalendarCheck,
  CalendarClock,
  History,
  Pause,
  Pencil,
  RotateCcw,
  ShieldAlert,
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
  type RequirementIntervalType,
  type RequirementCompletionRecord,
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

const intervalOptions: {
  value: RequirementIntervalType;
  label: string;
}[] = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "semiannual", label: "Semiannual" },
  { value: "annual", label: "Annual" },
  { value: "custom_days", label: "Custom days" },
  { value: "custom_months", label: "Custom months" },
];

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

function isCustomInterval(intervalType: RequirementIntervalType) {
  return intervalType === "custom_days" || intervalType === "custom_months";
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
      className: "border-destructive/40 bg-destructive/10 text-destructive",
    };
  }

  if (daysUntilDue <= 14) {
    return {
      label: "Due Soon",
      className: "border-amber-700/40 bg-amber-700/10 text-amber-900",
    };
  }

  if (daysUntilDue <= 30) {
    return {
      label: "Upcoming",
      className: "border-border text-muted-foreground",
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
              {isReadOnly || !isItemActive
                ? "No active requirement work is tied to this item."
                : "Add the first recurring obligation for this item when there is a maintenance, inspection, calibration, or replacement cadence to track."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requirements.map((requirement) => {
        const isPaused = requirement.pausedAt !== null;
        const tone = isPaused
          ? {
              label: "Paused",
              className: "border-border bg-secondary text-muted-foreground",
            }
          : dueTone(requirement.nextDueDate);

        return (
          <article
            className={`rounded-lg border bg-card p-4 ${
              isPaused ? "bg-secondary/45 text-muted-foreground" : ""
            }`}
            key={requirement.id}
          >
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
              <div className="min-w-0 space-y-2">
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
                {requirement.notes ? (
                  <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">
                    {requirement.notes}
                  </p>
                ) : null}
              </div>
              <div className="min-w-0 space-y-2 md:text-right">
                <div className="flex flex-wrap items-center gap-2 md:justify-end">
                  <span
                    className={`inline-flex h-6 items-center rounded-sm border px-1.5 font-mono text-[0.68rem] uppercase ${tone.className}`}
                  >
                    {tone.label}
                  </span>
                  <span className="inline-flex h-6 items-center rounded-sm border bg-secondary px-1.5 font-mono text-[0.68rem] uppercase text-muted-foreground">
                    {requirement.status}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 md:justify-end">
                  <CompleteRequirementDialog
                    isDisabled={isReadOnly || !isItemActive || isPaused}
                    itemId={itemId}
                    requirement={requirement}
                  />
                  <AdjustRequirementNextDueDialog
                    isDisabled={isReadOnly || !isItemActive || isPaused}
                    itemId={itemId}
                    requirement={requirement}
                  />
                  <RequirementPauseResumeButton
                    isDisabled={isReadOnly || !isItemActive}
                    itemId={itemId}
                    requirement={requirement}
                  />
                  <EditRequirementDialog
                    isDisabled={isReadOnly || !isItemActive}
                    itemId={itemId}
                    requirement={requirement}
                  />
                </div>
              </div>
            </div>
            <div className="mt-3">
              <RequirementCompletionHistory requirementId={requirement.id} />
            </div>
          </article>
        );
      })}
    </div>
  );
}

function AdjustRequirementNextDueDialog({
  requirement,
  itemId,
  isDisabled,
}: {
  requirement: RequirementRecord;
  itemId: string;
  isDisabled: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [nextDueDate, setNextDueDate] = useState(requirement.nextDueDate);
  const [error, setError] = useState<string | null>(null);
  const utilities = trpc.useUtils();
  const adjustMutation = trpc.requirements.adjustNextDue.useMutation({
    onSuccess: async () => {
      setIsOpen(false);
      setError(null);
      await Promise.all([
        utilities.requirements.list.invalidate({ itemId }),
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

    if (!/^\d{4}-\d{2}-\d{2}$/.test(nextDueDate)) {
      setError("Use YYYY-MM-DD.");
      return;
    }

    adjustMutation.mutate({
      requirementId: requirement.id,
      nextDueDate,
    });
  }

  return (
    <>
      <Button
        aria-label={`Adjust next due date for ${requirement.name}`}
        disabled={isDisabled}
        onClick={() => {
          setNextDueDate(requirement.nextDueDate);
          setError(null);
          setIsOpen(true);
        }}
        size="icon-lg"
        title="Adjust next due"
        type="button"
        variant="outline"
      >
        <CalendarClock aria-hidden="true" className="size-4" />
      </Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust next due</DialogTitle>
            <DialogDescription>
              Set a one-time next due date. The interval stays unchanged.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`next-due-adjust-${requirement.id}`}>
                  Next due date
                </Label>
                <Input
                  disabled={adjustMutation.isPending}
                  id={`next-due-adjust-${requirement.id}`}
                  onChange={(event) => setNextDueDate(event.target.value)}
                  type="date"
                  value={nextDueDate}
                />
              </div>
              <div className="space-y-2">
                <Label>Interval</Label>
                <div className="flex h-8 items-center rounded-lg border bg-secondary px-2.5 text-sm text-muted-foreground">
                  {formatInterval(requirement)}
                </div>
              </div>
            </div>

            {error ? (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
                {error}
              </p>
            ) : null}

            <DialogFooter>
              <Button
                disabled={adjustMutation.isPending}
                onClick={() => setIsOpen(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button disabled={adjustMutation.isPending} type="submit">
                {adjustMutation.isPending ? "Saving" : "Save due date"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function RequirementPauseResumeButton({
  requirement,
  itemId,
  isDisabled,
}: {
  requirement: RequirementRecord;
  itemId: string;
  isDisabled: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const utilities = trpc.useUtils();
  const invalidateRequirementSurfaces = async () => {
    await Promise.all([
      utilities.requirements.list.invalidate({ itemId }),
      utilities.audit.listRecentActivity.invalidate(),
      utilities.audit.listTargetActivity.invalidate({
        targetType: "item",
        targetId: itemId,
      }),
    ]);
  };
  const pauseMutation = trpc.requirements.pause.useMutation({
    onSuccess: async () => {
      setError(null);
      await invalidateRequirementSurfaces();
    },
    onError: (mutationError) => {
      setError(mutationError.message);
    },
  });
  const resumeMutation = trpc.requirements.resume.useMutation({
    onSuccess: async () => {
      setError(null);
      await invalidateRequirementSurfaces();
    },
    onError: (mutationError) => {
      setError(mutationError.message);
    },
  });
  const isPaused = requirement.pausedAt !== null;
  const isPending = pauseMutation.isPending || resumeMutation.isPending;

  return (
    <div className="flex flex-col items-start gap-1 sm:items-end">
      <Button
        disabled={isDisabled || isPending}
        onClick={() => {
          setError(null);
          if (isPaused) {
            resumeMutation.mutate({ requirementId: requirement.id });
          } else {
            pauseMutation.mutate({ requirementId: requirement.id });
          }
        }}
        size="lg"
        type="button"
        variant="outline"
      >
        {isPaused ? (
          <RotateCcw aria-hidden="true" className="size-4" />
        ) : (
          <Pause aria-hidden="true" className="size-4" />
        )}
        {isPaused ? "Resume" : "Pause"}
      </Button>
      {error ? (
        <p className="max-w-56 text-xs font-medium text-destructive">{error}</p>
      ) : null}
    </div>
  );
}

function EditRequirementDialog({
  requirement,
  itemId,
  isDisabled,
}: {
  requirement: RequirementRecord;
  itemId: string;
  isDisabled: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(requirement.name);
  const [notes, setNotes] = useState(requirement.notes ?? "");
  const [intervalType, setIntervalType] = useState<RequirementIntervalType>(
    requirement.intervalType,
  );
  const [intervalValue, setIntervalValue] = useState(
    requirement.intervalValue?.toString() ?? "",
  );
  const [error, setError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  const utilities = trpc.useUtils();
  const updateMutation = trpc.requirements.update.useMutation({
    onSuccess: async (result) => {
      setError(null);
      setDuplicateWarning(result.duplicateWarning);
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

      if (!result.duplicateWarning) {
        setIsOpen(false);
      }
    },
    onError: (mutationError) => {
      setDuplicateWarning(false);
      setError(mutationError.message);
    },
  });

  function resetForm() {
    setName(requirement.name);
    setNotes(requirement.notes ?? "");
    setIntervalType(requirement.intervalType);
    setIntervalValue(requirement.intervalValue?.toString() ?? "");
    setError(null);
    setDuplicateWarning(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setDuplicateWarning(false);

    let parsedIntervalValue: number | null = null;

    if (isCustomInterval(intervalType)) {
      parsedIntervalValue = Number(intervalValue);

      if (!Number.isInteger(parsedIntervalValue) || parsedIntervalValue < 1) {
        setError("Use a positive whole number for custom intervals.");
        return;
      }
    }

    updateMutation.mutate({
      requirementId: requirement.id,
      name,
      notes,
      intervalType,
      intervalValue: parsedIntervalValue,
    });
  }

  return (
    <>
      <Button
        aria-label={`Edit ${requirement.name}`}
        disabled={isDisabled}
        onClick={() => {
          resetForm();
          setIsOpen(true);
        }}
        size="icon-lg"
        title="Edit requirement"
        type="button"
        variant="outline"
      >
        <Pencil aria-hidden="true" className="size-4" />
      </Button>
      <Dialog
        open={isOpen}
        onOpenChange={(nextOpen) => {
          setIsOpen(nextOpen);

          if (!nextOpen) {
            resetForm();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit requirement</DialogTitle>
            <DialogDescription>
              Change the name, notes, or interval. Completion history stays
              preserved.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor={`requirement-edit-name-${requirement.id}`}>
                Name
              </Label>
              <Input
                disabled={updateMutation.isPending}
                id={`requirement-edit-name-${requirement.id}`}
                maxLength={200}
                onChange={(event) => setName(event.target.value)}
                value={name}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`requirement-edit-notes-${requirement.id}`}>
                Notes
              </Label>
              <Textarea
                disabled={updateMutation.isPending}
                id={`requirement-edit-notes-${requirement.id}`}
                maxLength={500}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Optional"
                value={notes}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_8rem]">
              <div className="space-y-2">
                <Label htmlFor={`requirement-edit-interval-${requirement.id}`}>
                  Interval
                </Label>
                <select
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={updateMutation.isPending}
                  id={`requirement-edit-interval-${requirement.id}`}
                  onChange={(event) => {
                    setIntervalType(
                      event.target.value as RequirementIntervalType,
                    );
                    setIntervalValue("");
                  }}
                  value={intervalType}
                >
                  {intervalOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {isCustomInterval(intervalType) ? (
                <div className="space-y-2">
                  <Label htmlFor={`requirement-edit-value-${requirement.id}`}>
                    Every
                  </Label>
                  <Input
                    disabled={updateMutation.isPending}
                    id={`requirement-edit-value-${requirement.id}`}
                    min={1}
                    onChange={(event) => setIntervalValue(event.target.value)}
                    type="number"
                    value={intervalValue}
                  />
                </div>
              ) : null}
            </div>

            {duplicateWarning ? (
              <div className="flex items-start gap-2 rounded-lg border border-amber-700/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-900">
                <ShieldAlert aria-hidden="true" className="mt-0.5 size-4" />
                <p>
                  Saved. Another requirement on this item has the same name.
                </p>
              </div>
            ) : null}

            {error ? (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
                {error}
              </p>
            ) : null}

            <DialogFooter>
              <Button
                disabled={updateMutation.isPending}
                onClick={() => setIsOpen(false)}
                type="button"
                variant="outline"
              >
                {duplicateWarning ? "Close" : "Cancel"}
              </Button>
              {duplicateWarning ? null : (
                <Button disabled={updateMutation.isPending} type="submit">
                  {updateMutation.isPending ? "Saving" : "Save changes"}
                </Button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
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
      {isReadOnly ? (
        <p className="mb-4 rounded-lg border bg-secondary px-4 py-3 text-sm text-muted-foreground">
          Requirement records remain visible while this account is read-only.
          Create, edit, pause, and completion actions are unavailable until
          access is restored.
        </p>
      ) : !isItemActive ? (
        <p className="mb-4 rounded-lg border bg-secondary px-4 py-3 text-sm text-muted-foreground">
          This item is archived. Requirement history remains visible, but active
          requirement changes are unavailable for archived items.
        </p>
      ) : null}
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
        size="lg"
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
  const recentHistory = history.slice(0, 3);
  const hasExpandedHistory = history.length > recentHistory.length;

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
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-mono text-[0.68rem] uppercase text-muted-foreground">
          <History aria-hidden="true" className="size-3.5" />
          Recent completions
        </div>
        {hasExpandedHistory ? (
          <RequirementCompletionHistoryDialog history={history} />
        ) : null}
      </div>
      <div className="space-y-1">
        {recentHistory.map((completion) => (
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

function RequirementCompletionHistoryDialog({
  history,
}: {
  history: RequirementCompletionRecord[];
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        className="h-7 px-2 text-xs"
        onClick={() => setIsOpen(true)}
        type="button"
        variant="outline"
      >
        <History aria-hidden="true" className="size-3.5" />
        View all completions
      </Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-h-[min(34rem,calc(100vh-2rem))] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Requirement completions</DialogTitle>
            <DialogDescription>
              Showing the latest {history.length} completion records available
              for this requirement.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {history.map((completion) => (
              <div
                className="rounded-md border bg-secondary/50 px-3 py-2"
                key={completion.id}
              >
                <div className="font-mono text-xs text-foreground">
                  {formatDateOnly(completion.completedOn)}
                </div>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {completion.notes || "No notes recorded"}
                </p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
