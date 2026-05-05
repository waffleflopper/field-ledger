"use client";

import { Info, Plus } from "lucide-react";
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

type CreateLocationFormProps = {
  canCreate: boolean;
  disabledReason: string | null;
  onSubmit: (input: { name: string }) => Promise<void>;
};

export function CreateLocationForm({
  canCreate,
  disabledReason,
  onSubmit,
}: CreateLocationFormProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const nameId = useId();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Location name is required.");
      return;
    }

    setSubmitting(true);

    try {
      await onSubmit({ name: trimmedName });
      setName("");
      setOpen(false);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Location was not created.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button disabled={!canCreate} title={disabledReason ?? undefined}>
          <Plus aria-hidden="true" data-icon="inline-start" />
          New location
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create location</DialogTitle>
            <DialogDescription>
              Add one reusable place name. Items can use it later from their
              detail screens.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor={nameId}>Name</Label>
            <Input
              autoComplete="off"
              id={nameId}
              maxLength={120}
              onChange={(event) => setName(event.target.value)}
              placeholder="Arms room"
              required
              value={name}
            />
          </div>

          <div className="flex items-start gap-2 rounded-md border bg-secondary px-3 py-2 text-sm text-muted-foreground">
            <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <p>
              Avoid classified information, PHI, grid coordinates, or sensitive
              operational detail in location names.
            </p>
          </div>

          {disabledReason ? (
            <p className="rounded-md border border-border bg-secondary px-3 py-2 text-sm text-muted-foreground">
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
            <Button disabled={submitting || !canCreate} type="submit">
              {submitting ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
