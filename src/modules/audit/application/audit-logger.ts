import type { AuditRepository } from "./audit-repository";
import type { AuditAction, AuditMetadata } from "./types";

type RecordAuditEventInput = {
  accountId: string;
  actorId: string;
  action: AuditAction;
  target?: {
    type: string;
    id: string;
  };
  metadata?: AuditMetadata;
  occurredAt?: Date;
  repository: AuditRepository;
};

export async function recordAuditEvent({
  accountId,
  actorId,
  action,
  target,
  metadata = null,
  occurredAt = new Date(),
  repository,
}: RecordAuditEventInput) {
  return repository.record({
    accountId,
    actorId,
    action,
    targetType: target?.type ?? null,
    targetId: target?.id ?? null,
    occurredAt,
    metadata,
  });
}
