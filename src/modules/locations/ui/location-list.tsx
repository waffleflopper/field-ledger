"use client";

import { Archive, CalendarDays, MapPin, Pencil } from "lucide-react";
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
import type { LocationRecord } from "@/modules/locations/application/types";

function formatCreatedDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

type LocationListProps = {
  locations: LocationRecord[];
  canManage: boolean;
  disabledReason: string | null;
  onArchive: (location: LocationRecord) => Promise<void>;
  onUpdate: (
    location: LocationRecord,
    input: { name: string },
  ) => Promise<void>;
};

type LocationActionsProps = {
  canManage: boolean;
  disabledReason: string | null;
  location: LocationRecord;
  onArchive: (location: LocationRecord) => Promise<void>;
  onUpdate: (
    location: LocationRecord,
    input: { name: string },
  ) => Promise<void>;
};

function LocationActions({
  canManage,
  disabledReason,
  location,
  onArchive,
  onUpdate,
}: LocationActionsProps) {
  const nameId = useId();
  const [editOpen, setEditOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [name, setName] = useState(location.name);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function handleEditOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setName(location.name);
      setError(null);
    }

    setEditOpen(nextOpen);
  }

  async function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Location name is required.");
      return;
    }

    setPending(true);

    try {
      await onUpdate(location, { name: trimmedName });
      setEditOpen(false);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Location was not updated.",
      );
    } finally {
      setPending(false);
    }
  }

  async function handleArchive() {
    setError(null);
    setPending(true);

    try {
      await onArchive(location);
      setArchiveOpen(false);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Location was not archived.",
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
            title={disabledReason ?? "Edit location"}
            type="button"
            variant="outline"
          >
            <Pencil aria-hidden="true" className="size-4" />
            <span className="sr-only">Edit {location.name}</span>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <form className="space-y-4" onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle>Edit location</DialogTitle>
              <DialogDescription>
                Rename this reusable place record.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor={nameId}>Name</Label>
              <Input
                autoComplete="off"
                id={nameId}
                maxLength={120}
                onChange={(event) => setName(event.target.value)}
                required
                value={name}
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
            title={disabledReason ?? "Archive location"}
            type="button"
            variant="outline"
          >
            <Archive aria-hidden="true" className="size-4" />
            <span className="sr-only">Archive {location.name}</span>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive location?</DialogTitle>
            <DialogDescription>
              {location.name} will leave normal location lists and suggestions.
              Existing item records keep their historical context.
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

export function LocationList({
  canManage,
  disabledReason,
  locations,
  onArchive,
  onUpdate,
}: LocationListProps) {
  return (
    <div className="divide-y rounded-lg border bg-card text-card-foreground">
      {locations.map((location) => (
        <article
          className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-secondary/40"
          key={location.id}
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
            <MapPin aria-hidden="true" className="size-4" />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-1">
              <h2 className="truncate text-base font-semibold tracking-normal">
                {location.name}
              </h2>
              <p className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground">
                <CalendarDays aria-hidden="true" className="size-3.5" />
                Added {formatCreatedDate(location.createdAt)}
              </p>
            </div>
            <LocationActions
              canManage={canManage}
              disabledReason={disabledReason}
              location={location}
              onArchive={onArchive}
              onUpdate={onUpdate}
            />
          </div>
        </article>
      ))}
    </div>
  );
}
