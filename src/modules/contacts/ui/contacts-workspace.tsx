"use client";

import { AlertTriangle } from "lucide-react";

import type { AccountCapabilities } from "@/modules/billing";
import type { ContactRecord } from "@/modules/contacts";
import { trpc } from "@/trpc/react";
import { ContactEmptyState } from "./contact-empty-state";
import { ContactList } from "./contact-list";
import { CreateContactForm } from "./create-contact-form";

type ContactsWorkspaceProps = {
  initialCapabilities: AccountCapabilities;
  initialContacts: ContactRecord[];
};

function getCreateDisabledReason(capabilities: AccountCapabilities) {
  if (capabilities.isReadOnly) {
    return "This account is read-only. Existing records remain available.";
  }

  return null;
}

export function ContactsWorkspace({
  initialCapabilities,
  initialContacts,
}: ContactsWorkspaceProps) {
  const utilities = trpc.useUtils();
  const contactsQuery = trpc.contacts.list.useQuery(undefined, {
    initialData: initialContacts,
  });
  const capabilitiesQuery = trpc.billing.capabilities.useQuery(undefined, {
    initialData: initialCapabilities,
  });
  const contacts = contactsQuery.data ?? [];
  const capabilities = capabilitiesQuery.data ?? initialCapabilities;
  const disabledReason = getCreateDisabledReason(capabilities);
  const canCreate = disabledReason === null;
  const createMutation = trpc.contacts.create.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utilities.contacts.list.invalidate(),
        utilities.contacts.search.invalidate(),
        utilities.billing.capabilities.invalidate(),
      ]);
    },
  });
  const updateMutation = trpc.contacts.update.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utilities.contacts.list.invalidate(),
        utilities.contacts.search.invalidate(),
      ]);
    },
  });
  const archiveMutation = trpc.contacts.archive.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utilities.contacts.list.invalidate(),
        utilities.contacts.search.invalidate(),
      ]);
    },
  });

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            Reusable assignees
          </p>
          <h1 className="text-2xl font-semibold tracking-normal md:text-3xl">
            Contacts
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Review account-wide assignee records and keep signed-to names
            consistent across manual item assignments and formal 2062s.
          </p>
        </div>

        <CreateContactForm
          canCreate={canCreate}
          disabledReason={disabledReason}
          onSubmit={async (input) => {
            await createMutation.mutateAsync(input);
          }}
        />
      </div>

      <div className="flex items-start gap-3 rounded-lg border bg-secondary px-4 py-3 text-sm text-muted-foreground">
        <AlertTriangle
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0 text-primary"
        />
        <p>
          Contacts are lightweight assignee names, not a team directory. Keep
          personal context minimal and avoid sensitive information.
        </p>
      </div>

      {disabledReason ? (
        <p className="rounded-lg border bg-secondary px-4 py-3 text-sm text-muted-foreground">
          {disabledReason}
        </p>
      ) : null}

      {contactsQuery.isLoading ? (
        <div className="space-y-2">
          <div className="h-16 rounded-lg border bg-card" />
          <div className="h-16 rounded-lg border bg-card" />
          <div className="h-16 rounded-lg border bg-card" />
        </div>
      ) : contactsQuery.error ? (
        <div
          className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          <AlertTriangle
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0"
          />
          <p>{contactsQuery.error.message}</p>
        </div>
      ) : contacts.length > 0 ? (
        <ContactList
          canManage={canCreate}
          contacts={contacts}
          disabledReason={disabledReason}
          onArchive={async (contact) => {
            await archiveMutation.mutateAsync({ id: contact.id });
          }}
          onUpdate={async (contact, input) => {
            await updateMutation.mutateAsync({
              id: contact.id,
              displayName: input.displayName,
            });
          }}
        />
      ) : (
        <ContactEmptyState canCreate={canCreate} />
      )}
    </section>
  );
}
