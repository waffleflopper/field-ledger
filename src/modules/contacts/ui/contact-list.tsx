"use client";

import { Archive, CalendarDays, Pencil, UserRound } from "lucide-react";
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
import type { ContactRecord } from "@/modules/contacts";

function formatCreatedDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

type ContactListProps = {
  contacts: ContactRecord[];
  canManage: boolean;
  disabledReason: string | null;
  onArchive: (contact: ContactRecord) => Promise<void>;
  onUpdate: (
    contact: ContactRecord,
    input: { displayName: string },
  ) => Promise<void>;
};

type ContactActionsProps = {
  canManage: boolean;
  contact: ContactRecord;
  disabledReason: string | null;
  onArchive: (contact: ContactRecord) => Promise<void>;
  onUpdate: (
    contact: ContactRecord,
    input: { displayName: string },
  ) => Promise<void>;
};

function ContactActions({
  canManage,
  contact,
  disabledReason,
  onArchive,
  onUpdate,
}: ContactActionsProps) {
  const displayNameId = useId();
  const [editOpen, setEditOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [displayName, setDisplayName] = useState(contact.displayName);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function handleEditOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setDisplayName(contact.displayName);
      setError(null);
    }

    setEditOpen(nextOpen);
  }

  async function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedDisplayName = displayName.trim();

    if (!trimmedDisplayName) {
      setError("Contact display name is required.");
      return;
    }

    setPending(true);

    try {
      await onUpdate(contact, { displayName: trimmedDisplayName });
      setEditOpen(false);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Contact was not updated.",
      );
    } finally {
      setPending(false);
    }
  }

  async function handleArchive() {
    setError(null);
    setPending(true);

    try {
      await onArchive(contact);
      setArchiveOpen(false);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Contact was not archived.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      <Dialog onOpenChange={handleEditOpenChange} open={editOpen}>
        <DialogTrigger asChild>
          <Button
            disabled={!canManage}
            size="icon"
            title={disabledReason ?? "Edit contact"}
            type="button"
            variant="outline"
          >
            <Pencil aria-hidden="true" className="size-4" />
            <span className="sr-only">Edit {contact.displayName}</span>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <form className="space-y-4" onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle>Edit contact</DialogTitle>
              <DialogDescription>
                Rename this reusable assignee record.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor={displayNameId}>Display name</Label>
              <Input
                autoComplete="off"
                id={displayNameId}
                maxLength={120}
                onChange={(event) => setDisplayName(event.target.value)}
                required
                value={displayName}
              />
            </div>
            {error ? (
              <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <DialogFooter>
              <Button
                disabled={pending}
                onClick={() => handleEditOpenChange(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button disabled={pending || !canManage} type="submit">
                {pending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog onOpenChange={setArchiveOpen} open={archiveOpen}>
        <DialogTrigger asChild>
          <Button
            disabled={!canManage}
            size="icon"
            title={disabledReason ?? "Archive contact"}
            type="button"
            variant="outline"
          >
            <Archive aria-hidden="true" className="size-4" />
            <span className="sr-only">Archive {contact.displayName}</span>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive contact?</DialogTitle>
            <DialogDescription>
              {contact.displayName} will leave normal contact lists and
              suggestions. Existing signed-to and 2062 history keeps its
              context.
            </DialogDescription>
          </DialogHeader>
          {error ? (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <DialogFooter>
            <Button
              disabled={pending}
              onClick={() => setArchiveOpen(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={pending || !canManage}
              onClick={handleArchive}
              type="button"
              variant="destructive"
            >
              {pending ? "Archiving..." : "Archive"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function ContactList({
  canManage,
  contacts,
  disabledReason,
  onArchive,
  onUpdate,
}: ContactListProps) {
  return (
    <div className="divide-y rounded-lg border bg-card text-card-foreground">
      {contacts.map((contact) => (
        <article
          className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-secondary/40"
          key={contact.id}
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
            <UserRound aria-hidden="true" className="size-4" />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-1">
              <h2 className="truncate text-base font-semibold tracking-normal">
                {contact.displayName}
              </h2>
              <p className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground">
                <CalendarDays aria-hidden="true" className="size-3.5" />
                Added {formatCreatedDate(contact.createdAt)}
              </p>
            </div>
            <ContactActions
              canManage={canManage}
              contact={contact}
              disabledReason={disabledReason}
              onArchive={onArchive}
              onUpdate={onUpdate}
            />
          </div>
        </article>
      ))}
    </div>
  );
}
