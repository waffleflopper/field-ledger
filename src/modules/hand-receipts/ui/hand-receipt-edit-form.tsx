"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { HandReceiptRecord } from "@/modules/hand-receipts";
import { trpc } from "@/trpc/react";

type HandReceiptEditFormProps = {
  handReceipt: HandReceiptRecord;
  isReadOnly: boolean;
  onCancel: () => void;
  onSaved: () => void;
};

type FormState = {
  name: string;
  notes: string;
  handReceiptNumber: string;
  holderName: string;
  unitName: string;
  uic: string;
  effectiveDate: string;
};

function toFormState(handReceipt: HandReceiptRecord): FormState {
  return {
    name: handReceipt.name,
    notes: handReceipt.notes ?? "",
    handReceiptNumber: handReceipt.handReceiptNumber ?? "",
    holderName: handReceipt.holderName ?? "",
    unitName: handReceipt.unitName ?? "",
    uic: handReceipt.uic ?? "",
    effectiveDate: handReceipt.effectiveDate ?? "",
  };
}

function blankToNull(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function HandReceiptEditForm({
  handReceipt,
  isReadOnly,
  onCancel,
  onSaved,
}: HandReceiptEditFormProps) {
  const utilities = trpc.useUtils();
  const [form, setForm] = useState<FormState>(() => toFormState(handReceipt));
  const [error, setError] = useState<string | null>(null);
  const updateMutation = trpc.handReceipts.update.useMutation({
    onSuccess: async (updated) => {
      setError(null);
      setForm(toFormState(updated));
      utilities.handReceipts.getById.setData({ id: handReceipt.id }, updated);
      await Promise.all([
        utilities.handReceipts.getById.invalidate({ id: handReceipt.id }),
        utilities.handReceipts.list.invalidate(),
      ]);
      onSaved();
    },
    onError: (mutationError) => {
      setError(mutationError.message);
    },
  });

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  return (
    <form
      className="rounded-lg border bg-card p-4 text-card-foreground"
      onSubmit={(event) => {
        event.preventDefault();

        if (isReadOnly) {
          return;
        }

        if (!form.name.trim()) {
          setError("Hand receipt name is required.");
          return;
        }

        updateMutation.mutate({
          id: handReceipt.id,
          name: form.name,
          notes: blankToNull(form.notes),
          handReceiptNumber: blankToNull(form.handReceiptNumber),
          holderName: blankToNull(form.holderName),
          unitName: blankToNull(form.unitName),
          uic: blankToNull(form.uic),
          effectiveDate: blankToNull(form.effectiveDate),
        });
      }}
    >
      <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold tracking-normal">
            Receipt Details
          </h2>
          <p className="text-sm text-muted-foreground">
            Edit the name and formal context for this active bucket.
          </p>
        </div>
        {isReadOnly ? (
          <span className="w-fit rounded-sm border bg-secondary px-2 py-1 font-mono text-[0.68rem] uppercase text-muted-foreground">
            Read only
          </span>
        ) : null}
      </div>

      <div className="grid gap-4 py-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="hand-receipt-name">Name</Label>
          <Input
            disabled={isReadOnly || updateMutation.isPending}
            id="hand-receipt-name"
            onChange={(event) => updateField("name", event.target.value)}
            required
            value={form.name}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="hand-receipt-number">Hand receipt number</Label>
          <Input
            disabled={isReadOnly || updateMutation.isPending}
            id="hand-receipt-number"
            onChange={(event) =>
              updateField("handReceiptNumber", event.target.value)
            }
            value={form.handReceiptNumber}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="holder-name">Holder name</Label>
          <Input
            disabled={isReadOnly || updateMutation.isPending}
            id="holder-name"
            onChange={(event) => updateField("holderName", event.target.value)}
            value={form.holderName}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="unit-name">Unit name</Label>
          <Input
            disabled={isReadOnly || updateMutation.isPending}
            id="unit-name"
            onChange={(event) => updateField("unitName", event.target.value)}
            value={form.unitName}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="uic">UIC</Label>
          <Input
            disabled={isReadOnly || updateMutation.isPending}
            id="uic"
            onChange={(event) => updateField("uic", event.target.value)}
            value={form.uic}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="effective-date">Effective date</Label>
          <Input
            disabled={isReadOnly || updateMutation.isPending}
            id="effective-date"
            onChange={(event) =>
              updateField("effectiveDate", event.target.value)
            }
            type="date"
            value={form.effectiveDate}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            disabled={isReadOnly || updateMutation.isPending}
            id="notes"
            onChange={(event) => updateField("notes", event.target.value)}
            value={form.notes}
          />
        </div>
      </div>

      {error ? (
        <p className="pb-3 text-sm font-medium text-destructive">{error}</p>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-2 border-t pt-4">
        <Button
          disabled={updateMutation.isPending}
          onClick={() => {
            setError(null);
            setForm(toFormState(handReceipt));
            onCancel();
          }}
          type="button"
          variant="outline"
        >
          Cancel
        </Button>
        {isReadOnly ? null : (
          <Button disabled={updateMutation.isPending} type="submit">
            {updateMutation.isPending ? "Saving" : "Save changes"}
          </Button>
        )}
      </div>
    </form>
  );
}
