import type { AccountRecord } from "@/modules/accounts/application/ensure-account";
import { recordAuditEvent, type AuditRepository } from "@/modules/audit";
import { deriveAccountCapabilities } from "@/modules/billing";
import type { LocationRepository } from "./location-repository";

type UpdateLocationInput = {
  account: AccountRecord;
  actorId: string;
  locationId: string;
  input: {
    name: string;
  };
  locationRepository: LocationRepository;
  auditRepository: AuditRepository;
  now?: Date;
};

export async function updateLocation({
  account,
  actorId,
  locationId,
  input,
  locationRepository,
  auditRepository,
  now = new Date(),
}: UpdateLocationInput) {
  const capabilities = deriveAccountCapabilities(account, now);

  if (capabilities.isReadOnly) {
    throw new Error("This account is read-only.");
  }

  const existing = await locationRepository.findById(account.id, locationId);

  if (!existing || existing.archivedAt) {
    return null;
  }

  const name = input.name.trim();

  if (!name) {
    throw new Error("Location name is required.");
  }

  if (name === existing.name) {
    return existing;
  }

  const updated = await locationRepository.update(account.id, locationId, {
    name,
    updatedAt: now,
  });

  if (!updated) {
    return null;
  }

  await recordAuditEvent({
    accountId: account.id,
    actorId,
    action: "location.updated",
    target: {
      type: "location",
      id: locationId,
    },
    metadata: {
      name,
      previousName: existing.name,
    },
    occurredAt: now,
    repository: auditRepository,
  });

  return updated;
}
