import type { AccountRecord } from "@/modules/accounts/application/ensure-account";
import { recordAuditEvent, type AuditRepository } from "@/modules/audit";
import { deriveAccountCapabilities } from "@/modules/billing";
import type { LocationRepository } from "./location-repository";

type ArchiveLocationInput = {
  account: AccountRecord;
  actorId: string;
  locationId: string;
  locationRepository: LocationRepository;
  auditRepository: AuditRepository;
  now?: Date;
};

export async function archiveLocation({
  account,
  actorId,
  locationId,
  locationRepository,
  auditRepository,
  now = new Date(),
}: ArchiveLocationInput) {
  const capabilities = deriveAccountCapabilities(account, now);

  if (capabilities.isReadOnly) {
    throw new Error("This account is read-only.");
  }

  const existing = await locationRepository.findById(account.id, locationId);

  if (!existing) {
    return null;
  }

  if (existing.archivedAt) {
    throw new Error("Location is already archived.");
  }

  const archived = await locationRepository.update(account.id, locationId, {
    archivedAt: now,
    updatedAt: now,
  });

  if (!archived) {
    return null;
  }

  await recordAuditEvent({
    accountId: account.id,
    actorId,
    action: "location.archived",
    target: {
      type: "location",
      id: locationId,
    },
    metadata: {
      name: existing.name,
    },
    occurredAt: now,
    repository: auditRepository,
  });

  return archived;
}
