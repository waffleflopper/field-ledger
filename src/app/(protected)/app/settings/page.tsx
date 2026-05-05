import { SettingsPanel } from "@/modules/accounts";
import { createTRPCContext } from "@/server/trpc/context";
import { appRouter } from "@/server/trpc/router";

export default async function SettingsPage() {
  const caller = appRouter.createCaller(await createTRPCContext());
  const account = await caller.accounts.me();

  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          Owner account
        </p>
        <h1 className="text-2xl font-semibold tracking-normal md:text-3xl">
          Settings
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Review your session and the product boundaries that keep Field Ledger
          personal, accountable, and separate from official recordkeeping.
        </p>
      </div>

      <SettingsPanel {...account} />
    </section>
  );
}
