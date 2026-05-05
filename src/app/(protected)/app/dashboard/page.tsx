import Link from "next/link";

import { ActivityList } from "@/modules/audit/ui/activity-list";
import { DashboardQuickActions } from "@/modules/dashboard/ui/dashboard-quick-actions";
import { DashboardSignedOut } from "@/modules/dashboard/ui/dashboard-signed-out";
import { DashboardRequirements } from "@/modules/requirements/ui/dashboard-requirements";
import { createTRPCContext } from "@/server/trpc/context";
import { appRouter } from "@/server/trpc/router";

export default async function DashboardPage() {
  const caller = appRouter.createCaller(await createTRPCContext());
  const [dashboardWork, signedOut, activity] = await Promise.all([
    caller.requirements.dashboardWork(),
    caller.items.dashboardSignedOut(),
    caller.audit.listRecentActivity({ limit: 5 }),
  ]);

  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-normal md:text-3xl">
          Dashboard
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Requirements, common property workflows, signed-out state, and recent
          activity in operational priority order.
        </p>
      </div>

      <DashboardRequirements {...dashboardWork} />

      <DashboardQuickActions isReadOnly={signedOut.isReadOnly} />

      <DashboardSignedOut {...signedOut} />

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold tracking-normal">
            Recent Activity
          </h2>
          <Link
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            href="/app/activity"
          >
            View all
          </Link>
        </div>
        <ActivityList
          activity={activity}
          emptyDescription="Hand receipt changes will appear here after you create or update records."
          emptyTitle="No recent changes"
          isCompact
        />
      </section>
    </section>
  );
}
