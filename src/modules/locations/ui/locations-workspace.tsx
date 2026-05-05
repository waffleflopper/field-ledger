"use client";

import type { AccountCapabilities } from "@/modules/billing";
import type { LocationRecord } from "@/modules/locations/application/types";
import { trpc } from "@/trpc/react";
import { AlertTriangle } from "lucide-react";
import { CreateLocationForm } from "./create-location-form";
import { LocationEmptyState } from "./location-empty-state";
import { LocationList } from "./location-list";

type LocationsWorkspaceProps = {
  initialCapabilities: AccountCapabilities;
  initialLocations: LocationRecord[];
};

function getCreateDisabledReason(capabilities: AccountCapabilities) {
  if (capabilities.isReadOnly) {
    return "This account is read-only. Existing records remain available.";
  }

  return null;
}

export function LocationsWorkspace({
  initialCapabilities,
  initialLocations,
}: LocationsWorkspaceProps) {
  const utilities = trpc.useUtils();
  const locationsQuery = trpc.locations.list.useQuery(undefined, {
    initialData: initialLocations,
  });
  const capabilitiesQuery = trpc.billing.capabilities.useQuery(undefined, {
    initialData: initialCapabilities,
  });
  const locations = locationsQuery.data ?? [];
  const capabilities = capabilitiesQuery.data ?? initialCapabilities;
  const disabledReason = getCreateDisabledReason(capabilities);
  const canCreate = disabledReason === null;
  const createMutation = trpc.locations.create.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utilities.locations.list.invalidate(),
        utilities.locations.search.invalidate(),
        utilities.billing.capabilities.invalidate(),
      ]);
    },
  });
  const updateMutation = trpc.locations.update.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utilities.locations.list.invalidate(),
        utilities.locations.search.invalidate(),
      ]);
    },
  });
  const archiveMutation = trpc.locations.archive.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utilities.locations.list.invalidate(),
        utilities.locations.search.invalidate(),
      ]);
    },
  });

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            Reusable places
          </p>
          <h1 className="text-2xl font-semibold tracking-normal md:text-3xl">
            Locations
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Review account-wide places and keep item location names consistent
            without storing sensitive operational detail.
          </p>
        </div>

        <CreateLocationForm
          canCreate={canCreate}
          disabledReason={disabledReason}
          onSubmit={async (input) => {
            await createMutation.mutateAsync(input);
          }}
        />
      </div>

      <div className="flex items-start gap-3 rounded-lg border bg-secondary px-4 py-3 text-sm text-muted-foreground">
        <AlertTriangle
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0 text-primary"
        />
        <p>
          Keep location names plain. Do not store classified information, PHI,
          grid coordinates, or sensitive operational detail here.
        </p>
      </div>

      {disabledReason ? (
        <p className="rounded-lg border bg-secondary px-4 py-3 text-sm text-muted-foreground">
          {disabledReason}
        </p>
      ) : null}

      {locations.length > 0 ? (
        <LocationList
          canManage={canCreate}
          disabledReason={disabledReason}
          locations={locations}
          onArchive={async (location) => {
            await archiveMutation.mutateAsync({ id: location.id });
          }}
          onUpdate={async (location, input) => {
            await updateMutation.mutateAsync({
              id: location.id,
              name: input.name,
            });
          }}
        />
      ) : (
        <LocationEmptyState canCreate={canCreate} />
      )}
    </section>
  );
}
