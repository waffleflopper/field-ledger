"use client";

import { useEffect, useId, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/trpc/react";

type ContactPickerProps = {
  disabled?: boolean;
  disabledReason?: string | null;
  currentContactName?: string | null;
  onAssignExisting: (contact: { id: string; displayName: string }) => void;
  onAssignNew: (displayName: string) => void;
  onClear: () => void;
  isPending?: boolean;
};

export function ContactPicker({
  disabled = false,
  disabledReason = null,
  currentContactName = null,
  onAssignExisting,
  onAssignNew,
  onClear,
  isPending = false,
}: ContactPickerProps) {
  const inputId = useId();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const trimmedQuery = query.trim();
  const trimmedDebouncedQuery = debouncedQuery.trim();
  const searchQuery = trpc.contacts.search.useQuery(
    { query: trimmedDebouncedQuery },
    {
      enabled: !disabled && trimmedDebouncedQuery.length > 0,
    },
  );
  const queryIsSettling = query !== debouncedQuery;
  const contacts = useMemo(
    () => (queryIsSettling ? [] : (searchQuery.data ?? [])),
    [queryIsSettling, searchQuery.data],
  );
  const hasExactMatch = useMemo(
    () =>
      contacts.some(
        (contact) =>
          contact.displayName.toLocaleLowerCase() ===
          trimmedQuery.toLocaleLowerCase(),
      ),
    [contacts, trimmedQuery],
  );
  const isSearching = queryIsSettling || searchQuery.isLoading;

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [query]);

  return (
    <section className="rounded-lg border bg-card p-4 text-card-foreground">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold tracking-normal">Signed to</h2>
          {currentContactName ? (
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-foreground">
                {currentContactName}
              </p>
              <span className="rounded-sm border bg-secondary px-2 py-1 font-mono text-[0.68rem] uppercase text-muted-foreground">
                No 2062
              </span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Not signed out.</p>
          )}
        </div>
        {currentContactName && !disabled ? (
          <Button
            disabled={isPending}
            onClick={onClear}
            size="sm"
            type="button"
            variant="outline"
          >
            Clear
          </Button>
        ) : null}
      </div>

      <div className="mt-4 space-y-2">
        <Label htmlFor={inputId}>Contact name</Label>
        <Input
          disabled={disabled || isPending}
          id={inputId}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search or create contact"
          value={query}
        />
        {disabled ? (
          <p className="text-sm text-muted-foreground">
            {disabledReason ??
              "Signed-to changes are unavailable for this item."}
          </p>
        ) : null}
        {!disabled && contacts.length > 0 ? (
          <div className="divide-y rounded-md border">
            {contacts.map((contact) => (
              <button
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-secondary"
                disabled={isPending}
                key={contact.id}
                onClick={() => {
                  onAssignExisting({
                    id: contact.id,
                    displayName: contact.displayName,
                  });
                  setQuery("");
                }}
                type="button"
              >
                <span className="font-medium">{contact.displayName}</span>
                <span className="font-mono text-[0.68rem] uppercase text-muted-foreground">
                  Use contact
                </span>
              </button>
            ))}
          </div>
        ) : null}
        {!disabled && trimmedQuery && !hasExactMatch && !isSearching ? (
          <Button
            disabled={isPending}
            onClick={() => {
              onAssignNew(trimmedQuery);
              setQuery("");
            }}
            size="sm"
            type="button"
            variant="outline"
          >
            Create {trimmedQuery}
          </Button>
        ) : null}
      </div>
    </section>
  );
}
