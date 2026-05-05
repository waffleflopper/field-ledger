import { createTRPCRouter } from "@/server/trpc/init";
import { accountsRouter } from "@/server/trpc/routers/accounts";
import { assignments2062Router } from "@/server/trpc/routers/assignments-2062";
import { auditRouter } from "@/server/trpc/routers/audit";
import { billingRouter } from "@/server/trpc/routers/billing";
import { contactsRouter } from "@/server/trpc/routers/contacts";
import { documentsRouter } from "@/server/trpc/routers/documents";
import { feedbackRouter } from "@/server/trpc/routers/feedback";
import { foundationRouter } from "@/server/trpc/routers/foundation";
import { handReceiptsRouter } from "@/server/trpc/routers/hand-receipts";
import { itemsRouter } from "@/server/trpc/routers/items";
import { locationsRouter } from "@/server/trpc/routers/locations";
import { requirementsRouter } from "@/server/trpc/routers/requirements";

export const appRouter = createTRPCRouter({
  accounts: accountsRouter,
  assignments2062: assignments2062Router,
  audit: auditRouter,
  billing: billingRouter,
  contacts: contactsRouter,
  documents: documentsRouter,
  feedback: feedbackRouter,
  foundation: foundationRouter,
  handReceipts: handReceiptsRouter,
  items: itemsRouter,
  locations: locationsRouter,
  requirements: requirementsRouter,
});

export type AppRouter = typeof appRouter;
