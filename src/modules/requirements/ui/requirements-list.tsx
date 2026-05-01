"use client";

import { CalendarClock, ShieldCheck } from "lucide-react";

import type { RequirementRecord } from "@/modules/requirements";
import { trpc } from "@/trpc/react";
import { CreateRequirementForm } from "./create-requirement-form";

type RequirementsListProps = {
  itemId: string;
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

export function RequirementsList({ itemId }: RequirementsListProps) {
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
              <span
                className={`inline-flex h-6 items-center rounded-md border px-2 font-mono text-[0.68rem] uppercase ${tone.className}`}
              >
                {tone.label}
              </span>
              <span className="inline-flex h-6 items-center rounded-md border px-2 font-mono text-[0.68rem] uppercase text-muted-foreground">
                {requirement.status}
              </span>
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
      <RequirementsList itemId={itemId} />
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
