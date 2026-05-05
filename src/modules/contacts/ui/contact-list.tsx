import { CalendarDays, UserRound } from "lucide-react";

import type { ContactRecord } from "@/modules/contacts";

function formatCreatedDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

type ContactListProps = {
  contacts: ContactRecord[];
};

export function ContactList({ contacts }: ContactListProps) {
  return (
    <div className="divide-y rounded-lg border bg-card text-card-foreground">
      {contacts.map((contact) => (
        <article
          className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-secondary/40"
          key={contact.id}
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
            <UserRound aria-hidden="true" className="size-4" />
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <h2 className="truncate text-base font-semibold tracking-normal">
              {contact.displayName}
            </h2>
            <p className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground">
              <CalendarDays aria-hidden="true" className="size-3.5" />
              Added {formatCreatedDate(contact.createdAt)}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}
