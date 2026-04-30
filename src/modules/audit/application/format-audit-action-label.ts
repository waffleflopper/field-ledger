import type { AuditAction } from "./types";

const auditActionLabels: Record<AuditAction, string> = {
  "account.onboarding_completed": "Onboarding completed",
  "hand_receipt.archived": "Hand receipt archived",
  "hand_receipt.created": "Hand receipt created",
  "hand_receipt.restored": "Hand receipt restored",
  "hand_receipt.updated": "Hand receipt updated",
  "system.initialized": "System initialized",
};

export function formatAuditActionLabel(action: AuditAction) {
  return auditActionLabels[action] ?? action;
}
