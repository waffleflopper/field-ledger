import type { AuditRepository } from "./audit-repository";
import { formatAuditActionLabel } from "./format-audit-action-label";
import type { AuditEventRecord, AuditMetadata } from "./types";

type ListRecentActivityInput = {
  accountId: string;
  repository: AuditRepository;
  limit?: number;
};

type ListTargetActivityInput = ListRecentActivityInput & {
  targetType: string;
  targetId: string;
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

function metadataName(metadata: AuditMetadata) {
  const name = metadata?.name;

  return typeof name === "string" && name.trim() ? name.trim() : null;
}

function metadataString(metadata: AuditMetadata, key: string) {
  const value = metadata?.[key];

  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function formatTargetLabel(event: AuditEventRecord) {
  if (event.targetType === "hand_receipt") {
    return metadataName(event.metadata) ?? "Hand receipt";
  }

  if (event.targetType === "item") {
    return metadataName(event.metadata) ?? "Item";
  }

  if (event.targetType === "requirement") {
    return metadataName(event.metadata) ?? "Requirement";
  }

  if (event.targetType === "contact") {
    return metadataString(event.metadata, "displayName") ?? "Contact";
  }

  if (event.targetType === "document") {
    return metadataString(event.metadata, "filename") ?? "Document";
  }

  if (event.targetType === "location") {
    return metadataName(event.metadata) ?? "Location";
  }

  if (event.targetType === "assignment") {
    const contactName = metadataString(event.metadata, "contactName");
    const documentFilename = metadataString(event.metadata, "documentFilename");

    return (
      contactName ??
      documentFilename ??
      metadataName(event.metadata) ??
      "2062 assignment"
    );
  }

  if (event.targetType === "account") {
    return "Account";
  }

  return null;
}

function toRecentActivityItem(event: AuditEventRecord) {
  return {
    id: event.id,
    action: event.action,
    label: formatAuditActionLabel(event.action),
    targetLabel: formatTargetLabel(event),
    targetType: event.targetType,
    targetId: event.targetId,
    occurredAt: event.occurredAt,
    metadata: event.metadata,
  };
}

export async function listRecentActivity({
  accountId,
  repository,
  limit,
}: ListRecentActivityInput) {
  const events = await repository.listByAccountId(accountId, {
    limit: normalizeRecentActivityLimit(limit),
  });

  return events.map(toRecentActivityItem);
}

export async function listTargetActivity({
  accountId,
  repository,
  targetType,
  targetId,
  limit,
}: ListTargetActivityInput) {
  const events = await repository.listByTarget(
    accountId,
    {
      targetType,
      targetId,
    },
    {
      limit: normalizeRecentActivityLimit(limit),
    },
  );

  return events.map(toRecentActivityItem);
}
