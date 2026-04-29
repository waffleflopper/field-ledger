import { CreditCard } from "lucide-react";

import { PlaceholderPage } from "@/components/shell/placeholder-page";

export default function BillingPage() {
  return (
    <PlaceholderPage
      description="Billing will expose subscription status and plan capability context through the app-owned billing boundary."
      icon={CreditCard}
      sections={["Subscription status", "Plan capability", "Read-only states"]}
      title="Billing"
    />
  );
}
