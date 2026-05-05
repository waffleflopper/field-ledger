import { ContactsWorkspace } from "@/modules/contacts/ui/contacts-workspace";
import { createTRPCContext } from "@/server/trpc/context";
import { appRouter } from "@/server/trpc/router";

export default async function ContactsPage() {
  const caller = appRouter.createCaller(await createTRPCContext());
  const [contacts, capabilities] = await Promise.all([
    caller.contacts.list(),
    caller.billing.capabilities(),
  ]);

  return (
    <ContactsWorkspace
      initialCapabilities={capabilities}
      initialContacts={contacts}
    />
  );
}
