import { createTRPCRouter } from "@/server/trpc/init";
import { accountsRouter } from "@/server/trpc/routers/accounts";
import { auditRouter } from "@/server/trpc/routers/audit";
import { billingRouter } from "@/server/trpc/routers/billing";
import { contactsRouter } from "@/server/trpc/routers/contacts";
import { foundationRouter } from "@/server/trpc/routers/foundation";
import { handReceiptsRouter } from "@/server/trpc/routers/hand-receipts";
import { itemsRouter } from "@/server/trpc/routers/items";

export const appRouter = createTRPCRouter({
  accounts: accountsRouter,
  audit: auditRouter,
  billing: billingRouter,
  contacts: contactsRouter,
  foundation: foundationRouter,
  handReceipts: handReceiptsRouter,
  items: itemsRouter,
});

export type AppRouter = typeof appRouter;
