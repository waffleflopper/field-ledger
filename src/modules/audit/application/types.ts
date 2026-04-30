export type AuditAction =
  | "system.initialized"
  | "account.onboarding_completed"
  | "hand_receipt.created"
  | "hand_receipt.updated"
  | "hand_receipt.archived"
  | "hand_receipt.restored";

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
  targetType: string | null;
  targetId: string | null;
  occurredAt: Date;
  metadata: AuditMetadata;
};
