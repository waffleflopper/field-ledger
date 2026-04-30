import type { AuditRepository } from "./audit-repository";
import { formatAuditActionLabel } from "./format-audit-action-label";

type ListRecentActivityInput = {
  accountId: string;
  repository: AuditRepository;
  limit?: number;
};

export async function listRecentActivity({
  accountId,
  repository,
  limit = 20,
}: ListRecentActivityInput) {
  const events = await repository.listByAccountId(accountId, { limit });

  return events.map((event) => ({
    id: event.id,
    action: event.action,
    label: formatAuditActionLabel(event.action),
    targetType: event.targetType,
    targetId: event.targetId,
    occurredAt: event.occurredAt,
    metadata: event.metadata,
  }));
}
