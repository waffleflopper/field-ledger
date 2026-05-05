import { LocationsWorkspace } from "@/modules/locations/ui/locations-workspace";
import { createTRPCContext } from "@/server/trpc/context";
import { appRouter } from "@/server/trpc/router";

export default async function LocationsPage() {
  const caller = appRouter.createCaller(await createTRPCContext());
  const [locations, capabilities] = await Promise.all([
    caller.locations.list(),
    caller.billing.capabilities(),
  ]);

  return (
    <LocationsWorkspace
      initialCapabilities={capabilities}
      initialLocations={locations}
    />
  );
}
