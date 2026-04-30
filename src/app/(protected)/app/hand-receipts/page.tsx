import { HandReceiptsWorkspace } from "@/modules/hand-receipts/ui/hand-receipts-workspace";
import { createTRPCContext } from "@/server/trpc/context";
import { appRouter } from "@/server/trpc/router";

export default async function HandReceiptsPage() {
  const caller = appRouter.createCaller(await createTRPCContext());
  const [handReceipts, capabilities] = await Promise.all([
    caller.handReceipts.list(),
    caller.billing.capabilities(),
  ]);

  return (
    <HandReceiptsWorkspace
      initialCapabilities={capabilities}
      initialHandReceipts={handReceipts}
    />
  );
}
