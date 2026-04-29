import { ClipboardList } from "lucide-react";

import { PlaceholderPage } from "@/components/shell/placeholder-page";

export default function HandReceiptsPage() {
  return (
    <PlaceholderPage
      description="Hand Receipts will organize property into the user's named receipt buckets without becoming an organization or official record system."
      icon={ClipboardList}
      sections={["Receipt list", "Receipt detail", "Linked property"]}
      title="Hand Receipts"
    />
  );
}
