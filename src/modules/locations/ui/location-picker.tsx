"use client";

import { MapPin, X } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/trpc/react";

type LocationPickerProps = {
  value: string | null;
  currentLocationName?: string | null;
  disabled?: boolean;
  isPending?: boolean;
  onChange: (location: { id: string; name: string } | null) => void;
};

export function LocationPicker({
  value,
  currentLocationName = null,
  disabled = false,
  isPending = false,
  onChange,
}: LocationPickerProps) {
  const utilities = trpc.useUtils();
  const [query, setQuery] = useState("");
  const searchQuery = trpc.locations.search.useQuery(
    { query },
    {
      enabled: !disabled,
    },
  );
  const createMutation = trpc.locations.create.useMutation({
    onSuccess: async (location) => {
      onChange({ id: location.id, name: location.name });
      setQuery("");
      await Promise.all([
        utilities.locations.list.invalidate(),
        utilities.locations.search.invalidate(),
      ]);
    },
  });
  const locations = searchQuery.data ?? [];
  const trimmedQuery = query.trim();
  const selectedLocation =
    locations.find((location) => location.id === value) ??
    (value && currentLocationName
      ? { id: value, name: currentLocationName }
      : null);
  const hasExactMatch = useMemo(
    () =>
      locations.some(
        (location) =>
          location.name.toLocaleLowerCase() ===
          trimmedQuery.toLocaleLowerCase(),
      ),
    [locations, trimmedQuery],
  );
  const pending = isPending || createMutation.isPending;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor="item-location">Location</Label>
        {selectedLocation ? (
          <Button
            disabled={disabled || pending}
            onClick={() => onChange(null)}
            size="sm"
            type="button"
            variant="outline"
          >
            <X aria-hidden="true" className="size-4" />
            Clear
          </Button>
        ) : null}
      </div>
      <div className="rounded-md border bg-secondary p-3">
        <div className="flex items-center gap-2 text-sm">
          <MapPin aria-hidden="true" className="size-4 text-muted-foreground" />
          <span className="font-medium">
            {selectedLocation?.name ?? "No location"}
          </span>
        </div>
        <Input
          className="mt-3 bg-background"
          disabled={disabled || pending}
          id="item-location"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search or create location"
          value={query}
        />
        {disabled ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Location changes are paused while this account is read-only.
          </p>
        ) : null}
        {!disabled && locations.length > 0 ? (
          <div className="mt-3 divide-y rounded-md border bg-card">
            {locations.map((location) => (
              <button
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-secondary"
                disabled={pending}
                key={location.id}
                onClick={() => {
                  onChange({ id: location.id, name: location.name });
                  setQuery("");
                }}
                type="button"
              >
                <span className="font-medium">{location.name}</span>
                <span className="font-mono text-[0.68rem] uppercase text-muted-foreground">
                  Use location
                </span>
              </button>
            ))}
          </div>
        ) : null}
        {!disabled && trimmedQuery && !hasExactMatch ? (
          <Button
            className="mt-3"
            disabled={pending}
            onClick={() => createMutation.mutate({ name: trimmedQuery })}
            size="sm"
            type="button"
            variant="outline"
          >
            Create {trimmedQuery}
          </Button>
        ) : null}
        {createMutation.error ? (
          <p className="mt-2 text-sm font-medium text-destructive">
            {createMutation.error.message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
