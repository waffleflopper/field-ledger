import {
  AlertTriangle,
  CreditCard,
  LockKeyhole,
  ReceiptText,
} from "lucide-react";

import {
  getBillingStatusDisplay,
  type BillingStatusDisplayInput,
} from "@/modules/billing/application/billing-status-display";

type BillingStatusProps = BillingStatusDisplayInput & {
  trialStartsAt: Date;
};

export function BillingStatus(status: BillingStatusProps) {
  const display = getBillingStatusDisplay(status);

  return (
    <div className="space-y-4">
      {status.isReadOnly ? (
        <div className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive">
          <LockKeyhole aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <div className="space-y-1">
            <h2 className="text-sm font-semibold tracking-normal">
              Account is read-only
            </h2>
            <p className="text-sm leading-6 text-foreground">
              {display.stateDescription}
            </p>
          </div>
        </div>
      ) : null}

      <section className="grid gap-3 lg:grid-cols-[1.3fr_1fr]">
        <article className="rounded-lg border bg-card p-4 text-card-foreground">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
              <CreditCard aria-hidden="true" className="size-4" />
            </span>
            <div className="min-w-0 space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                  Current access
                </p>
                <h2 className="mt-1 text-lg font-semibold tracking-normal">
                  {display.stateLabel}
                </h2>
              </div>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                {display.stateDescription}
              </p>
              <dl className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-md bg-muted/70 p-3">
                  <dt className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                    Plan
                  </dt>
                  <dd className="mt-1 text-sm font-semibold">
                    {display.planLabel}
                  </dd>
                </div>
                <div className="rounded-md bg-muted/70 p-3">
                  <dt className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                    Access window
                  </dt>
                  <dd className="mt-1 text-sm font-semibold">
                    {display.accessWindowLabel}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </article>

        <article className="rounded-lg border bg-card p-4 text-card-foreground">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
              <ReceiptText aria-hidden="true" className="size-4" />
            </span>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                  Hand receipt capability
                </p>
                <h2 className="mt-1 text-lg font-semibold tracking-normal">
                  {display.handReceiptLimitLabel}
                </h2>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">
                Base allows up to 3 active hand receipts. Pro and active trial
                access are unlimited for MVP account work.
              </p>
            </div>
          </div>
        </article>
      </section>

      <section className="flex gap-3 rounded-lg border bg-muted/60 p-4">
        <AlertTriangle
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0 text-amber-700"
        />
        <div className="space-y-1">
          <h2 className="text-sm font-semibold tracking-normal">
            Billing management coming soon
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            This page is read-only status context. Field Ledger does not have
            Stripe checkout, invoices, customer portal, or webhook behavior in
            this MVP slice.
          </p>
        </div>
      </section>
    </div>
  );
}
