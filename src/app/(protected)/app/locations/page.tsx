import { MapPin } from "lucide-react";

import { PlaceholderPage } from "@/components/shell/placeholder-page";

export default function LocationsPage() {
  return (
    <PlaceholderPage
      description="Locations will provide reusable account-level places for property records without storing sensitive operational details."
      icon={MapPin}
      sections={["Location list", "Reusable places", "Item placement"]}
      title="Locations"
    />
  );
}
