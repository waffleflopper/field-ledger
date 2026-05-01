"use client";

import { Plus } from "lucide-react";
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

type CreateHandReceiptFormProps = {
  canCreate: boolean;
  disabledReason: string | null;
  onSubmit: (input: { name: string; notes: string | null }) => Promise<void>;
};

export function CreateHandReceiptForm({
  canCreate,
  disabledReason,
  onSubmit,
}: CreateHandReceiptFormProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const nameId = useId();
  const notesId = useId();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Name is required.");
      return;
    }

    setSubmitting(true);

    try {
      await onSubmit({
        name,
        notes: notes.trim() ? notes : null,
      });
      setName("");
      setNotes("");
      setOpen(false);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Hand receipt was not created.",
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
          New hand receipt
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create hand receipt</DialogTitle>
            <DialogDescription>
              Add a named bucket now. Formal metadata can be filled in later.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor={nameId}>Name</Label>
            <Input
              autoComplete="off"
              id={nameId}
              maxLength={120}
              onChange={(event) => setName(event.target.value)}
              placeholder="HQ hand receipt"
              required
              value={name}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={notesId}>Notes</Label>
            <Textarea
              id={notesId}
              maxLength={1000}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Optional context for this receipt"
              value={notes}
            />
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
