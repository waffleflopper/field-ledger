import { ActivityList } from "@/modules/audit/ui/activity-list";
import { createTRPCContext } from "@/server/trpc/context";
import { appRouter } from "@/server/trpc/router";

export default async function ActivityPage() {
  const caller = appRouter.createCaller(await createTRPCContext());
  const activity = await caller.audit.listRecentActivity({ limit: 20 });

  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          Account history
        </p>
        <h1 className="text-2xl font-semibold tracking-normal md:text-3xl">
          Activity
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Recent account activity appears here as Field Ledger records
          meaningful property-accountability changes.
        </p>
      </div>

      <ActivityList activity={activity} />
    </section>
  );
}
