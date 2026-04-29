import { Search } from "lucide-react";

import { PlaceholderPage } from "@/components/shell/placeholder-page";

export default function ItemsPage() {
  return (
    <PlaceholderPage
      description="Items will provide searchable accountable property records, identifier details, current location, signed-to state, and requirement context."
      icon={Search}
      sections={["Inventory list", "Search and filters", "Item detail entry"]}
      title="Items"
    />
  );
}
