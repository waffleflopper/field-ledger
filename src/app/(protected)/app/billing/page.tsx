import { BillingStatus } from "@/modules/billing";
import { createTRPCContext } from "@/server/trpc/context";
import { appRouter } from "@/server/trpc/router";

export default async function BillingPage() {
  const caller = appRouter.createCaller(await createTRPCContext());
  const status = await caller.billing.status();

  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          Account access
        </p>
        <h1 className="text-2xl font-semibold tracking-normal md:text-3xl">
          Billing
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Review your MVP access state, plan capability, and read-only status.
          Billing actions are not connected to Stripe yet.
        </p>
      </div>

      <BillingStatus {...status} />
    </section>
  );
}
