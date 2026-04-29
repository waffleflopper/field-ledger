import { ClipboardList, FileText, Search } from "lucide-react";

const dashboardSections = [
  {
    description:
      "Overdue and due-soon requirements will appear here before lower-priority context.",
    icon: FileText,
    label: "Requirements",
  },
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

export default function DashboardPage() {
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

      <div className="grid gap-3 lg:grid-cols-3">
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
    </section>
  );
}
