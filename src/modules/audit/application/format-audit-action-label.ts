import type { AuditAction, KnownAuditAction } from "./types";

const auditActionLabels: Record<KnownAuditAction, string> = {
  "account.onboarding_completed": "Onboarding completed",
  "hand_receipt.archived": "Hand receipt archived",
  "hand_receipt.created": "Hand receipt created",
  "hand_receipt.restored": "Hand receipt restored",
  "hand_receipt.updated": "Hand receipt updated",
  "system.initialized": "System initialized",
};

export function formatAuditActionLabel(action: AuditAction) {
  return auditActionLabels[action as KnownAuditAction] ?? "Activity recorded";
}
