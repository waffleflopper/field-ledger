import { ClipboardList, FileText, Search } from "lucide-react";

import { ScaffoldApiStatus } from "@/components/scaffold-api-status";
import { Button } from "@/components/ui/button";

const scaffoldChecks = [
  "Next.js App Router",
  "Tailwind v4",
  "shadcn/ui",
  "Strict TypeScript",
];

const workflowPlaceholders = [
  {
    label: "Hand receipts",
    icon: ClipboardList,
  },
  {
    label: "Items and search",
    icon: Search,
  },
  {
    label: "2062 documents",
    icon: FileText,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center gap-10 px-6 py-10 sm:px-8">
        <div className="max-w-3xl space-y-5">
          <p className="text-sm font-medium text-muted-foreground">
            Field Ledger
          </p>
          <h1 className="text-4xl font-semibold tracking-normal text-balance sm:text-5xl">
            Personal property accountability, scaffolded for the real app.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            The first running shell is intentionally narrow: it proves the app
            foundation while leaving product workflows for their own vertical
            slices.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {scaffoldChecks.map((check) => (
            <div
              className="rounded-lg border bg-card px-4 py-3 text-sm font-medium text-card-foreground"
              key={check}
            >
              {check}
            </div>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {workflowPlaceholders.map(({ icon: Icon, label }) => (
            <Button
              className="h-12 justify-start"
              disabled
              key={label}
              variant="outline"
            >
              <Icon aria-hidden="true" />
              {label}
            </Button>
          ))}
        </div>

        <ScaffoldApiStatus />
      </section>
    </main>
  );
}
