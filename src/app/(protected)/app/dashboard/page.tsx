import { ClipboardList, Search } from "lucide-react";
import Link from "next/link";

import { ActivityList } from "@/modules/audit/ui/activity-list";
import { DashboardRequirements } from "@/modules/requirements/ui/dashboard-requirements";
import { createTRPCContext } from "@/server/trpc/context";
import { appRouter } from "@/server/trpc/router";

const dashboardSections = [
  {
    description:
      "Fast entry points will support adding items, reviewing hand receipts, and uploading 2062s.",
    icon: Search,
    label: "Quick actions",
  },
  {
    description:
      "Formal 2062 assignments and manual signed-to items will both be visible, with clear labels.",
    icon: ClipboardList,
    label: "Signed-out items",
  },
];

export default async function DashboardPage() {
  const caller = appRouter.createCaller(await createTRPCContext());
  const [dashboardWork, activity] = await Promise.all([
    caller.requirements.dashboardWork(),
    caller.audit.listRecentActivity({ limit: 5 }),
  ]);

  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          Authenticated home
        </p>
        <h1 className="text-2xl font-semibold tracking-normal md:text-3xl">
          Dashboard
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          This surface will prioritize requirements, quick actions, and
          signed-out property without inventing records before those slices
          exist.
        </p>
      </div>

      <DashboardRequirements {...dashboardWork} />

      <div className="grid gap-3 lg:grid-cols-2">
        {dashboardSections.map(({ description, icon: Icon, label }) => (
          <article
            className="rounded-lg border bg-card p-4 text-card-foreground"
            key={label}
          >
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-md bg-secondary text-primary">
                <Icon aria-hidden="true" className="size-4" />
              </span>
              <h2 className="text-base font-semibold tracking-normal">
                {label}
              </h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </article>
        ))}
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold tracking-normal">
              Recent Activity
            </h2>
            <p className="text-sm text-muted-foreground">
              Account changes, kept below the operational queue.
            </p>
          </div>
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
