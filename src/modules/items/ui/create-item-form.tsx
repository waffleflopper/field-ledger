"use client";

import { AlertTriangle, Plus } from "lucide-react";
import { useId, useState, type FormEvent } from "react";

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
import { Textarea } from "@/components/ui/textarea";
import type { CreateItemResult } from "@/modules/items";
import { LocationPicker } from "@/modules/locations/ui/location-picker";

type CreateItemFormProps = {
  canCreate: boolean;
  disabledReason: string | null;
  onSubmit: (input: {
    nomenclature: string;
    ecn: string | null;
    serialNumber: string | null;
    notes: string | null;
    locationId: string | null;
    generateFieldLedgerId: boolean;
    confirmDuplicate?: boolean;
  }) => Promise<CreateItemResult>;
};

function blankStringToNull(value: string) {
  return value.trim() ? value : null;
}

function getSubmitButtonLabel({
  duplicateWarning,
  submitting,
}: {
  duplicateWarning: CreateItemResult["duplicateWarning"];
  submitting: boolean;
}) {
  if (submitting) {
    return "Saving";
  }

  if (duplicateWarning) {
    return "Confirm duplicate";
  }

  return "Create item";
}

export function CreateItemForm({
  canCreate,
  disabledReason,
  onSubmit,
}: CreateItemFormProps) {
  const [open, setOpen] = useState(false);
  const [nomenclature, setNomenclature] = useState("");
  const [ecn, setEcn] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [location, setLocation] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [generateFieldLedgerId, setGenerateFieldLedgerId] = useState(false);
  const [confirmDuplicate, setConfirmDuplicate] = useState(false);
  const [duplicateWarning, setDuplicateWarning] =
    useState<CreateItemResult["duplicateWarning"]>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [locationPending, setLocationPending] = useState(false);
  const nomenclatureId = useId();
  const ecnId = useId();
  const serialNumberId = useId();
  const generatedIdId = useId();
  const generatedIdLabelId = useId();
  const generatedIdDescriptionId = useId();
  const notesId = useId();

  const submitButtonLabel = getSubmitButtonLabel({
    duplicateWarning,
    submitting,
  });

  function resetForm() {
    setNomenclature("");
    setEcn("");
    setSerialNumber("");
    setNotes("");
    setLocation(null);
    setGenerateFieldLedgerId(false);
    setConfirmDuplicate(false);
    setDuplicateWarning(undefined);
    setError(null);
    setLocationPending(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen) {
      resetForm();
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!nomenclature.trim()) {
      setError("Nomenclature is required.");
      return;
    }

    if (!ecn.trim() && !serialNumber.trim() && !generateFieldLedgerId) {
      setError("Add an ECN, serial number, or generated Field Ledger ID.");
      return;
    }

    setSubmitting(true);

    try {
      const result = await onSubmit({
        nomenclature,
        ecn: blankStringToNull(ecn),
        serialNumber: blankStringToNull(serialNumber),
        notes: blankStringToNull(notes),
        locationId: location?.id ?? null,
        generateFieldLedgerId,
        confirmDuplicate,
      });

      if (result.duplicateWarning) {
        setDuplicateWarning(result.duplicateWarning);
        setConfirmDuplicate(true);
        return;
      }

      resetForm();
      setOpen(false);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Item was not created.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogTrigger asChild>
        <Button
          disabled={!canCreate}
          size="sm"
          title={disabledReason ?? undefined}
        >
          <Plus aria-hidden="true" data-icon="inline-start" />
          Add item
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add property item</DialogTitle>
            <DialogDescription>
              Create one physical accountable item in this hand receipt.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor={nomenclatureId}>Nomenclature</Label>
            <Input
              autoComplete="off"
              id={nomenclatureId}
              maxLength={160}
              onChange={(event) => setNomenclature(event.target.value)}
              placeholder="M4 carbine"
              required
              value={nomenclature}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={ecnId}>ECN</Label>
              <Input
                autoComplete="off"
                id={ecnId}
                maxLength={120}
                onChange={(event) => setEcn(event.target.value)}
                placeholder="ECN-001"
                value={ecn}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={serialNumberId}>Serial number</Label>
              <Input
                autoComplete="off"
                id={serialNumberId}
                maxLength={120}
                onChange={(event) => setSerialNumber(event.target.value)}
                placeholder="SN123456"
                value={serialNumber}
              />
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-md border bg-secondary px-3 py-2 text-sm">
            <input
              aria-describedby={generatedIdDescriptionId}
              aria-labelledby={generatedIdLabelId}
              checked={generateFieldLedgerId}
              className="mt-1"
              id={generatedIdId}
              onChange={(event) =>
                setGenerateFieldLedgerId(event.target.checked)
              }
              type="checkbox"
            />
            <span>
              <Label
                className="block font-medium text-foreground"
                htmlFor={generatedIdId}
                id={generatedIdLabelId}
              >
                Generate Field Ledger ID
              </Label>
              <span
                className="block leading-6 text-muted-foreground"
                id={generatedIdDescriptionId}
              >
                Use this when ECN and serial are not available yet.
              </span>
            </span>
          </div>

          <div className="space-y-2">
            <Label htmlFor={notesId}>Notes</Label>
            <Textarea
              id={notesId}
              maxLength={1000}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Optional non-sensitive item context"
              value={notes}
            />
          </div>

          <LocationPicker
            currentLocationName={location?.name ?? null}
            disabled={!canCreate}
            isPending={submitting}
            onPendingChange={setLocationPending}
            onChange={setLocation}
            value={location?.id ?? null}
          />

          {duplicateWarning ? (
            <div
              className="flex items-start gap-3 rounded-md border border-amber-700/30 bg-amber-700/10 px-3 py-2 text-sm text-amber-900"
              role="alert"
            >
              <AlertTriangle
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0"
              />
              <p>
                Matching ECN or serial number found. Submit again to confirm
                this is a separate physical item.
              </p>
            </div>
          ) : null}

          {disabledReason ? (
            <p className="rounded-md border bg-secondary px-3 py-2 text-sm text-muted-foreground">
              {disabledReason}
            </p>
          ) : null}

          {error ? (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              disabled={submitting}
              onClick={() => setOpen(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={submitting || locationPending || !canCreate}
              type="submit"
            >
              {submitButtonLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
