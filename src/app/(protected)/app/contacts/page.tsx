import { UserRound } from "lucide-react";

import { PlaceholderPage } from "@/components/shell/placeholder-page";

export default function ContactsPage() {
  return (
    <PlaceholderPage
      description="Contacts will hold account-level assignee names and optional user-entered context for property accountability workflows."
      icon={UserRound}
      sections={["Assignee list", "Contact detail", "Signed-to history"]}
      title="Contacts"
    />
  );
}
