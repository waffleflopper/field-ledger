"use client";

import { AlertTriangle } from "lucide-react";
import { useState, type FormEvent } from "react";

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
import type { DuplicateCheckResult, ItemRecord } from "@/modules/items";
import { trpc } from "@/trpc/react";

type ItemEditFormProps = {
  item: ItemRecord;
  isReadOnly: boolean;
  onCancel: () => void;
  onSaved: () => void;
};

type FormState = {
  nomenclature: string;
  ecn: string;
  serialNumber: string;
  generatedId: string;
  notes: string;
};

function toFormState(item: ItemRecord): FormState {
  return {
    nomenclature: item.nomenclature,
    ecn: item.ecn ?? "",
    serialNumber: item.serialNumber ?? "",
    generatedId: item.generatedId ?? "",
    notes: item.notes ?? "",
  };
}

function blankToNull(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function primaryIdentifier(item: ItemRecord) {
  if (item.ecn) {
    return `ECN ${item.ecn}`;
  }

  if (item.serialNumber) {
    return `Serial ${item.serialNumber}`;
  }

  return item.generatedId ?? "Generated ID only";
}

export function ItemEditForm({
  item,
  isReadOnly,
  onCancel,
  onSaved,
}: ItemEditFormProps) {
  const utilities = trpc.useUtils();
  const [form, setForm] = useState<FormState>(() => toFormState(item));
  const [error, setError] = useState<string | null>(null);
  const [pendingDuplicate, setPendingDuplicate] =
    useState<DuplicateCheckResult | null>(null);
  const updateMutation = trpc.items.update.useMutation({
    onSuccess: async (result) => {
      if (result.duplicateWarning) {
        setPendingDuplicate(result.duplicateWarning);
        return;
      }

      if (!result.item) {
        setError("Item was not found.");
        return;
      }

      setError(null);
      setForm(toFormState(result.item));
      utilities.items.getById.setData({ id: item.id }, result.item);
      await Promise.all([
        utilities.items.getById.invalidate({ id: item.id }),
        utilities.items.list.invalidate(),
        utilities.items.listByHandReceipt.invalidate({
          handReceiptId: item.handReceiptId,
        }),
        utilities.audit.listRecentActivity.invalidate(),
        utilities.audit.listTargetActivity.invalidate({
          targetType: "item",
          targetId: item.id,
        }),
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
    setPendingDuplicate(null);
  }

  async function submitForm(confirmDuplicate = false) {
    if (isReadOnly) {
      return;
    }

    if (!form.nomenclature.trim()) {
      setError("Item nomenclature is required.");
      return;
    }

    if (!form.ecn.trim() && !form.serialNumber.trim() && !form.generatedId) {
      setError("Add an ECN, serial number, or generated Field Ledger ID.");
      return;
    }

    const ecn = blankToNull(form.ecn);
    const serialNumber = blankToNull(form.serialNumber);
    const notes = blankToNull(form.notes);
    setError(null);

    const identifiersChanged =
      ecn !== item.ecn || serialNumber !== item.serialNumber;

    if (!confirmDuplicate && identifiersChanged) {
      const duplicateCheck =
        await utilities.items.checkDuplicateIdentifier.fetch({
          itemId: item.id,
          ecn,
          serialNumber,
        });

      if (duplicateCheck.hasDuplicate) {
        setPendingDuplicate(duplicateCheck);
        return;
      }
    }

    updateMutation.mutate({
      id: item.id,
      nomenclature: form.nomenclature,
      ecn,
      serialNumber,
      notes,
      ...(confirmDuplicate ? { confirmDuplicate: true } : {}),
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitForm(false);
  }

  return (
    <>
      <form
        className="rounded-lg border bg-card p-4 text-card-foreground"
        onSubmit={handleSubmit}
      >
        <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold tracking-normal">
              Item Details
            </h2>
            <p className="text-sm text-muted-foreground">
              Edit item identifiers and non-sensitive notes.
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
            <Label htmlFor="item-nomenclature">Nomenclature</Label>
            <Input
              disabled={isReadOnly || updateMutation.isPending}
              id="item-nomenclature"
              maxLength={160}
              onChange={(event) =>
                updateField("nomenclature", event.target.value)
              }
              required
              value={form.nomenclature}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="item-ecn">ECN</Label>
            <Input
              disabled={isReadOnly || updateMutation.isPending}
              id="item-ecn"
              maxLength={500}
              onChange={(event) => updateField("ecn", event.target.value)}
              value={form.ecn}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="item-serial-number">Serial number</Label>
            <Input
              disabled={isReadOnly || updateMutation.isPending}
              id="item-serial-number"
              maxLength={500}
              onChange={(event) =>
                updateField("serialNumber", event.target.value)
              }
              value={form.serialNumber}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="item-generated-id">Generated Field Ledger ID</Label>
            <Input
              disabled
              id="item-generated-id"
              value={form.generatedId || "Not generated"}
            />
            <p className="text-xs leading-5 text-muted-foreground">
              Generated IDs stay with the item and are not edited manually.
            </p>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="item-notes">Notes</Label>
            <Textarea
              disabled={isReadOnly || updateMutation.isPending}
              id="item-notes"
              maxLength={1000}
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
              setPendingDuplicate(null);
              setForm(toFormState(item));
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

      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setPendingDuplicate(null);
          }
        }}
        open={pendingDuplicate !== null}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm possible duplicate?</DialogTitle>
            <DialogDescription>
              Another item already uses this ECN or serial number. Confirm only
              if this is a separate physical item.
            </DialogDescription>
          </DialogHeader>
          {pendingDuplicate ? (
            <div className="space-y-3 rounded-md border bg-secondary p-3 text-sm">
              <div className="flex items-start gap-2 text-amber-900">
                <AlertTriangle
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0"
                />
                <p className="font-medium">Matching identifier found</p>
              </div>
              <ul className="space-y-2">
                {pendingDuplicate.existingItems.map((existingItem) => (
                  <li
                    className="rounded-md border bg-card px-3 py-2"
                    key={existingItem.id}
                  >
                    <p className="font-medium">{existingItem.nomenclature}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {primaryIdentifier(existingItem)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <DialogFooter>
            <Button
              disabled={updateMutation.isPending}
              onClick={() => setPendingDuplicate(null)}
              type="button"
              variant="outline"
            >
              Keep editing
            </Button>
            <Button
              disabled={updateMutation.isPending}
              onClick={() => {
                setPendingDuplicate(null);
                void submitForm(true);
              }}
              type="button"
            >
              {updateMutation.isPending ? "Saving" : "Confirm duplicate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
