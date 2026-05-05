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

type CreateContactFormProps = {
  canCreate: boolean;
  disabledReason: string | null;
  onSubmit: (input: { displayName: string }) => Promise<void>;
};

export function CreateContactForm({
  canCreate,
  disabledReason,
  onSubmit,
}: CreateContactFormProps) {
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const displayNameId = useId();

  function resetForm() {
    setDisplayName("");
    setError(null);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      resetForm();
    }

    setOpen(nextOpen);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedDisplayName = displayName.trim();

    if (!trimmedDisplayName) {
      setError("Contact display name is required.");
      return;
    }

    if (trimmedDisplayName.length > 120) {
      setError("Contact display name must be 120 characters or fewer.");
      return;
    }

    setSubmitting(true);

    try {
      await onSubmit({ displayName: trimmedDisplayName });
      handleOpenChange(false);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Contact was not created.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogTrigger asChild>
        <Button disabled={!canCreate} title={disabledReason ?? undefined}>
          <Plus aria-hidden="true" data-icon="inline-start" />
          New contact
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create contact</DialogTitle>
            <DialogDescription>
              Add one reusable assignee name for signed-to and 2062 workflows.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor={displayNameId}>Display name</Label>
            <Input
              autoComplete="off"
              id={displayNameId}
              maxLength={120}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="SSG Rivera"
              required
              value={displayName}
            />
          </div>

          <div className="flex items-start gap-2 rounded-md border bg-secondary px-3 py-2 text-sm text-muted-foreground">
            <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <p>
              Keep contact names limited to practical assignee context. Do not
              store PHI, classified information, or sensitive operational detail
              here.
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
              onClick={() => handleOpenChange(false)}
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
