import { ReceiptText } from "lucide-react";

import { PlaceholderPage } from "@/components/shell/placeholder-page";

export default function Active2062sPage() {
  return (
    <PlaceholderPage
      description="Active 2062s will show formal DA Form 2062 assignments only, with linked items and close-out paths when that workflow lands."
      icon={ReceiptText}
      sections={["Formal assignments", "Linked items", "Close workflow"]}
      title="Active 2062s"
    />
  );
}
