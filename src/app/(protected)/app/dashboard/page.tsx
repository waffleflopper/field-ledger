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
    <section className="space-y-5 md:space-y-6">
      <div className="max-w-3xl space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.06em] text-muted-foreground">
          Today&apos;s work
        </p>
        <div className="space-y-3">
          <h1 className="text-2xl font-semibold tracking-normal md:text-3xl">
            Dashboard
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Handle overdue requirements first, then check signed-out property
            and recent record changes.
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(20rem,0.85fr)] xl:items-start">
        <DashboardRequirements {...dashboardWork} />

        <div className="space-y-6">
          <DashboardQuickActions
            isReadOnly={signedOut.isReadOnly}
            layout="rail"
          />

          <DashboardSignedOut {...signedOut} layout="rail" />

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold tracking-normal">
                Recent changes
              </h2>
              <Link
                className="rounded-sm text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                href="/app/activity"
              >
                View all
              </Link>
            </div>
            <ActivityList
              activity={activity}
              emptyDescription="Your audit trail starts when you create, assign, archive, or update property records."
              emptyTitle="No changes recorded yet"
              isCompact
            />
          </section>
        </div>
      </div>
    </section>
  );
}
