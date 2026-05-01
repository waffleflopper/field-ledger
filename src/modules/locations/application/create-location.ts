import type { AccountRecord } from "@/modules/accounts/application/ensure-account";
import { recordAuditEvent, type AuditRepository } from "@/modules/audit";
import { deriveAccountCapabilities } from "@/modules/billing";
import type { LocationRepository } from "./location-repository";
import type { LocationRecord } from "./types";

type CreateLocationInput = {
  account: AccountRecord;
  actorId: string;
  input: {
    name: string;
  };
  locationRepository: LocationRepository;
  auditRepository: AuditRepository;
  now?: Date;
  createLocationId?: () => string;
};

export async function createLocation({
  account,
  actorId,
  input,
  locationRepository,
  auditRepository,
  now = new Date(),
  createLocationId = () => globalThis.crypto.randomUUID(),
}: CreateLocationInput): Promise<LocationRecord> {
  const capabilities = deriveAccountCapabilities(account, now);

  if (capabilities.isReadOnly) {
    throw new Error("This account is read-only.");
  }

  const name = input.name.trim();

  if (!name) {
    throw new Error("Location name is required.");
  }

  const location = await locationRepository.create({
    id: createLocationId(),
    accountId: account.id,
    name,
    createdAt: now,
    updatedAt: now,
  });

  await recordAuditEvent({
    accountId: account.id,
    actorId,
    action: "location.created",
    target: {
      type: "location",
      id: location.id,
    },
    metadata: {
      name,
    },
    occurredAt: now,
    repository: auditRepository,
  });

  return location;
}
