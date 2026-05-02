"use client";

import { useState, type FormEvent } from "react";
import { CalendarPlus, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RequirementIntervalType } from "@/modules/requirements";
import { trpc } from "@/trpc/react";

type CreateRequirementFormProps = {
  itemId: string;
  isReadOnly: boolean;
  isItemActive: boolean;
  onSuccess?: () => void;
};

type FormErrors = Partial<
  Record<"name" | "intervalValue" | "nextDueDate" | "form", string>
>;

const passwordManagerIgnoreProps = {
  autoComplete: "off",
  "data-1p-ignore": "true",
  "data-bwignore": "true",
  "data-lpignore": "true",
} as const;

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

function isCustomInterval(intervalType: RequirementIntervalType) {
  return intervalType === "custom_days" || intervalType === "custom_months";
}

export function CreateRequirementForm({
  itemId,
  isReadOnly,
  isItemActive,
  onSuccess,
}: CreateRequirementFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [intervalType, setIntervalType] =
    useState<RequirementIntervalType>("monthly");
  const [intervalValue, setIntervalValue] = useState("");
  const [nextDueDate, setNextDueDate] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [pendingDuplicateConfirmation, setPendingDuplicateConfirmation] =
    useState(false);
  const utilities = trpc.useUtils();
  const createMutation = trpc.requirements.create.useMutation({
    onSuccess: async (result) => {
      if (result.duplicateWarning) {
        setPendingDuplicateConfirmation(true);
        return;
      }

      resetForm();
      setIsOpen(false);
      await Promise.all([
        utilities.requirements.list.invalidate({ itemId }),
        utilities.audit.listRecentActivity.invalidate(),
        utilities.audit.listTargetActivity.invalidate({
          targetType: "item",
          targetId: itemId,
        }),
      ]);
      onSuccess?.();
    },
    onError: (error) => {
      setPendingDuplicateConfirmation(false);
      setErrors({ form: error.message });
    },
  });

  const isDisabled = isReadOnly || !isItemActive;

  function resetForm() {
    setName("");
    setIntervalType("monthly");
    setIntervalValue("");
    setNextDueDate("");
    setErrors({});
    setPendingDuplicateConfirmation(false);
  }

  function validate() {
    const nextErrors: FormErrors = {};

    if (!name.trim()) {
      nextErrors.name = "Name is required.";
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(nextDueDate)) {
      nextErrors.nextDueDate = "Use YYYY-MM-DD.";
    }

    if (isCustomInterval(intervalType)) {
      const parsedValue = Number(intervalValue);

      if (!Number.isInteger(parsedValue) || parsedValue < 1) {
        nextErrors.intervalValue = "Use a positive whole number.";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function submitRequirement({
    confirmDuplicate = false,
  }: { confirmDuplicate?: boolean } = {}) {
    if (!validate()) {
      return;
    }

    setErrors({});
    createMutation.mutate({
      itemId,
      name,
      intervalType,
      intervalValue: isCustomInterval(intervalType)
        ? Number(intervalValue)
        : null,
      nextDueDate,
      ...(confirmDuplicate ? { confirmDuplicate } : {}),
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submitRequirement();
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(nextOpen) => {
        setIsOpen(nextOpen);

        if (!nextOpen) {
          resetForm();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button disabled={isDisabled} size="sm" type="button">
          <CalendarPlus aria-hidden="true" className="size-4" />
          Add requirement
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add requirement</DialogTitle>
          <DialogDescription>
            Attach a recurring item obligation with a date-only next due date.
          </DialogDescription>
        </DialogHeader>

        {isDisabled ? (
          <div className="rounded-lg border bg-secondary px-3 py-2 text-sm text-muted-foreground">
            {isReadOnly
              ? "Requirement creation is paused while this account is read-only."
              : "Requirement creation is unavailable for archived items."}
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={handleSubmit}
            {...passwordManagerIgnoreProps}
          >
            <div className="space-y-2">
              <Label htmlFor="requirement-name">Name</Label>
              <Input
                id="requirement-name"
                maxLength={200}
                onChange={(event) => setName(event.target.value)}
                value={name}
                {...passwordManagerIgnoreProps}
              />
              {errors.name ? (
                <p className="text-sm font-medium text-destructive">
                  {errors.name}
                </p>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_8rem]">
              <div className="space-y-2">
                <Label htmlFor="requirement-interval">Interval</Label>
                <select
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  id="requirement-interval"
                  onChange={(event) => {
                    setIntervalType(
                      event.target.value as RequirementIntervalType,
                    );
                    setIntervalValue("");
                    setPendingDuplicateConfirmation(false);
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
                  <Label htmlFor="requirement-interval-value">Every</Label>
                  <Input
                    id="requirement-interval-value"
                    min={1}
                    onChange={(event) => setIntervalValue(event.target.value)}
                    type="number"
                    value={intervalValue}
                    {...passwordManagerIgnoreProps}
                  />
                </div>
              ) : null}
            </div>

            {errors.intervalValue ? (
              <p className="text-sm font-medium text-destructive">
                {errors.intervalValue}
              </p>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="requirement-next-due">Next due date</Label>
              <Input
                id="requirement-next-due"
                onChange={(event) => setNextDueDate(event.target.value)}
                type="date"
                value={nextDueDate}
                {...passwordManagerIgnoreProps}
              />
              {errors.nextDueDate ? (
                <p className="text-sm font-medium text-destructive">
                  {errors.nextDueDate}
                </p>
              ) : null}
            </div>

            {pendingDuplicateConfirmation ? (
              <div className="flex items-start gap-2 rounded-lg border border-amber-700/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-900">
                <ShieldAlert aria-hidden="true" className="mt-0.5 size-4" />
                <p>
                  A requirement with this name already exists for this item.
                  Confirm if this is intentional.
                </p>
              </div>
            ) : null}

            {errors.form ? (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
                {errors.form}
              </p>
            ) : null}

            <DialogFooter>
              <Button
                disabled={createMutation.isPending}
                onClick={() => setIsOpen(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              {pendingDuplicateConfirmation ? (
                <Button
                  disabled={createMutation.isPending}
                  onClick={() => submitRequirement({ confirmDuplicate: true })}
                  type="button"
                >
                  Confirm duplicate
                </Button>
              ) : (
                <Button disabled={createMutation.isPending} type="submit">
                  {createMutation.isPending ? "Adding" : "Add requirement"}
                </Button>
              )}
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
