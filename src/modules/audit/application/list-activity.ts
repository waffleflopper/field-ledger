import type { AuditRepository } from "./audit-repository";
import { formatAuditActionLabel } from "./format-audit-action-label";

type ListRecentActivityInput = {
  accountId: string;
  repository: AuditRepository;
  limit?: number;
};

export const DEFAULT_RECENT_ACTIVITY_LIMIT = 20;
export const MAX_RECENT_ACTIVITY_LIMIT = 50;

export function normalizeRecentActivityLimit(
  limit: number | undefined,
): number {
  if (limit === undefined || !Number.isInteger(limit)) {
    return DEFAULT_RECENT_ACTIVITY_LIMIT;
  }

  return Math.min(Math.max(limit, 1), MAX_RECENT_ACTIVITY_LIMIT);
}

export async function listRecentActivity({
  accountId,
  repository,
  limit,
}: ListRecentActivityInput) {
  const events = await repository.listByAccountId(accountId, {
    limit: normalizeRecentActivityLimit(limit),
  });

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
