import { Settings } from "lucide-react";

import { PlaceholderPage } from "@/components/shell/placeholder-page";

export default function SettingsPage() {
  return (
    <PlaceholderPage
      description="Settings will contain account preferences and compliance-facing product boundaries for the individual owner account."
      icon={Settings}
      sections={[
        "Account preferences",
        "Product boundaries",
        "Session actions",
      ]}
      title="Settings"
    />
  );
}
