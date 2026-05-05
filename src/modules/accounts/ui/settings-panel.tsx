import { AlertTriangle, LogOut, ShieldCheck, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AccessState } from "@/modules/accounts/application/ensure-account";

type SettingsPanelProps = {
  email: string | null;
  accessState: AccessState;
  isReadOnly: boolean;
};

const accessStateLabels: Record<AccessState, string> = {
  active: "Active",
  paused_read_only: "Read-only",
  trialing: "Trialing",
};

export function SettingsPanel({
  accessState,
  email,
  isReadOnly,
}: SettingsPanelProps) {
  return (
    <div className="space-y-4">
      {isReadOnly ? (
        <div className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive">
          <AlertTriangle
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0"
          />
          <p className="text-sm leading-6 text-foreground">
            Your account is read-only. You can still review existing property
            records, but new changes are unavailable until access is restored.
          </p>
        </div>
      ) : null}

      <section className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-lg border bg-card p-4 text-card-foreground">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
              <UserRound aria-hidden="true" className="size-4" />
            </span>
            <div className="min-w-0 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                  Owner account
                </p>
                <h2 className="mt-1 break-words text-lg font-semibold tracking-normal">
                  {email ?? "No email on session"}
                </h2>
              </div>
              <dl className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-md bg-muted/70 p-3">
                  <dt className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                    Access state
                  </dt>
                  <dd className="mt-1 text-sm font-semibold">
                    {accessStateLabels[accessState]}
                  </dd>
                </div>
                <div className="rounded-md bg-muted/70 p-3">
                  <dt className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                    Account shape
                  </dt>
                  <dd className="mt-1 text-sm font-semibold">
                    One owner account
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </article>

        <article className="rounded-lg border bg-card p-4 text-card-foreground">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
              <LogOut aria-hidden="true" className="size-4" />
            </span>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                  Session
                </p>
                <h2 className="mt-1 text-lg font-semibold tracking-normal">
                  Signed in
                </h2>
              </div>
              <form action="/auth/signout" method="post">
                <Button type="submit" variant="outline">
                  <LogOut aria-hidden="true" data-icon="inline-start" />
                  Sign out
                </Button>
              </form>
            </div>
          </div>
        </article>
      </section>

      <section className="rounded-lg border bg-card p-4 text-card-foreground">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
            <ShieldCheck aria-hidden="true" className="size-4" />
          </span>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                Product boundaries
              </p>
              <h2 className="mt-1 text-lg font-semibold tracking-normal">
                Personal property-accountability assistance
              </h2>
            </div>
            <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
              <li>Field Ledger is not an official Army system of record.</li>
              <li>
                Do not store classified information, PHI, or sensitive
                operational details.
              </li>
              <li>
                Field Ledger is for one owner account, not a team, unit, or
                organization workspace.
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
