export type KnownAuditAction =
  | "system.initialized"
  | "account.onboarding_completed"
  | "assignment.created"
  | "assignment_item_link.created"
  | "contact.created"
  | "document.uploaded"
  | "hand_receipt.created"
  | "hand_receipt.updated"
  | "hand_receipt.archived"
  | "hand_receipt.restored"
  | "item.created"
  | "item.archived"
  | "item.moved"
  | "item.restored"
  | "item.signed_to_assigned"
  | "item.signed_to_cleared"
  | "item.location_changed"
  | "item.updated"
  | "location.created"
  | "requirement.completed"
  | "requirement.created"
  | "requirement.next_due_adjusted"
  | "requirement.paused"
  | "requirement.resumed"
  | "requirement.updated";

export type AuditAction = KnownAuditAction | (string & {});

export type AuditMetadata = Record<string, unknown> | null;

export type AuditEventRecord = {
  id: string;
  accountId: string;
  actorId: string;
  action: AuditAction;
  targetType: string | null;
  targetId: string | null;
  occurredAt: Date;
  metadata: AuditMetadata;
  createdAt: Date;
};

export type NewAuditEventRecord = Omit<AuditEventRecord, "id" | "createdAt"> & {
  id?: string;
  createdAt?: Date;
};

export type RecentActivityItem = {
  id: string;
  action: AuditAction;
  label: string;
  targetLabel: string | null;
  targetType: string | null;
  targetId: string | null;
  occurredAt: Date;
  metadata: AuditMetadata;
};
