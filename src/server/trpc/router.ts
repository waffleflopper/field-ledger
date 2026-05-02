import { createTRPCRouter } from "@/server/trpc/init";
import { accountsRouter } from "@/server/trpc/routers/accounts";
import { auditRouter } from "@/server/trpc/routers/audit";
import { billingRouter } from "@/server/trpc/routers/billing";
import { contactsRouter } from "@/server/trpc/routers/contacts";
import { documentsRouter } from "@/server/trpc/routers/documents";
import { foundationRouter } from "@/server/trpc/routers/foundation";
import { handReceiptsRouter } from "@/server/trpc/routers/hand-receipts";
import { itemsRouter } from "@/server/trpc/routers/items";
import { locationsRouter } from "@/server/trpc/routers/locations";
import { requirementsRouter } from "@/server/trpc/routers/requirements";

export const appRouter = createTRPCRouter({
  accounts: accountsRouter,
  audit: auditRouter,
  billing: billingRouter,
  contacts: contactsRouter,
  documents: documentsRouter,
  foundation: foundationRouter,
  handReceipts: handReceiptsRouter,
  items: itemsRouter,
  locations: locationsRouter,
  requirements: requirementsRouter,
});

export type AppRouter = typeof appRouter;
