import { Activity } from "lucide-react";

import { PlaceholderPage } from "@/components/shell/placeholder-page";

export default function ActivityPage() {
  return (
    <PlaceholderPage
      description="Activity will surface meaningful state changes so accountable records remain reviewable as feature slices add behavior."
      icon={Activity}
      sections={["Recent changes", "Record history", "Audit-facing events"]}
      title="Activity"
    />
  );
}
