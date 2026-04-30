import type { AuditAction } from "./types";

const auditActionLabels: Record<AuditAction, string> = {
  "account.onboarding_completed": "Onboarding completed",
  "hand_receipt.created": "Hand receipt created",
  "hand_receipt.updated": "Hand receipt updated",
  "system.initialized": "System initialized",
};

export function formatAuditActionLabel(action: AuditAction) {
  return auditActionLabels[action] ?? action;
}
