import type { AuditAction, KnownAuditAction } from "./types";

const auditActionLabels: Record<KnownAuditAction, string> = {
  "account.onboarding_completed": "Onboarding completed",
  "assignment.closed": "2062 assignment closed",
  "assignment.created": "2062 assignment created",
  "assignment_item_link.created": "Item linked to 2062",
  "assignment_item_link.removed": "Item removed from 2062",
  "contact.archived": "Contact archived",
  "contact.created": "Contact created",
  "contact.updated": "Contact updated",
  "document.uploaded": "Document uploaded",
  "hand_receipt.archived": "Hand receipt archived",
  "hand_receipt.created": "Hand receipt created",
  "hand_receipt.restored": "Hand receipt restored",
  "hand_receipt.updated": "Hand receipt updated",
  "item.archived": "Item archived",
  "item.created": "Item created",
  "item.moved": "Item moved",
  "item.restored": "Item restored",
  "item.signed_to_assigned": "Item signed to contact",
  "item.signed_to_cleared": "Item signed-to cleared",
  "item.location_changed": "Item location changed",
  "item.updated": "Item updated",
  "location.archived": "Location archived",
  "location.created": "Location created",
  "location.updated": "Location updated",
  "requirement.completed": "Requirement completed",
  "requirement.created": "Requirement created",
  "requirement.next_due_adjusted": "Requirement next due adjusted",
  "requirement.paused": "Requirement paused",
  "requirement.resumed": "Requirement resumed",
  "requirement.updated": "Requirement updated",
  "system.initialized": "System initialized",
};

export function formatAuditActionLabel(action: AuditAction) {
  return auditActionLabels[action as KnownAuditAction] ?? "Activity recorded";
}
