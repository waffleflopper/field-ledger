import { describe, expect, it } from "vitest";

import type { AccountRecord } from "@/modules/accounts/application/ensure-account";
import { createLocation, searchLocations } from "@/modules/locations";
import { InMemoryAuditRepository } from "../../support/audit-repository";
import { InMemoryLocationRepository } from "../../support/location-repository";

function createAccount(overrides: Partial<AccountRecord> = {}): AccountRecord {
  return {
    id: "account-1",
    userId: "owner-1",
    accessState: "active",
    subscriptionTier: "base",
    trialStartsAt: new Date("2026-04-01T12:00:00.000Z"),
    trialEndsAt: new Date("2100-01-01T00:00:00.000Z"),
    onboardingCompletedAt: null,
    ...overrides,
  };
}

describe("locations", () => {
  it("creates an account-owned location and records audit history", async () => {
    const account = createAccount();
    const locationRepository = new InMemoryLocationRepository();
    const auditRepository = new InMemoryAuditRepository();

    const location = await createLocation({
      account,
      actorId: account.userId,
      input: {
        name: "Arms room",
      },
      locationRepository,
      auditRepository,
      now: new Date("2026-05-01T12:00:00.000Z"),
      createLocationId: () => "location-1",
    });

    expect(location).toMatchObject({
      id: "location-1",
      accountId: account.id,
      name: "Arms room",
    });
    expect(auditRepository.events).toMatchObject([
      {
        action: "location.created",
        targetType: "location",
        targetId: "location-1",
        metadata: {
          name: "Arms room",
        },
      },
    ]);
  });

  it("blocks location creation for read-only accounts", async () => {
    await expect(
      createLocation({
        account: createAccount({
          accessState: "paused_read_only",
          subscriptionTier: "pro",
        }),
        actorId: "owner-1",
        input: {
          name: "Arms room",
        },
        locationRepository: new InMemoryLocationRepository(),
        auditRepository: new InMemoryAuditRepository(),
      }),
    ).rejects.toThrow("This account is read-only.");
  });

  it("suggests account locations by case-insensitive prefix", async () => {
    const repository = new InMemoryLocationRepository([
      {
        id: "location-1",
        accountId: "account-1",
        name: "Arms room",
        createdAt: new Date("2026-05-01T12:00:00.000Z"),
        updatedAt: new Date("2026-05-01T12:00:00.000Z"),
      },
      {
        id: "location-2",
        accountId: "account-1",
        name: "Motor pool",
        createdAt: new Date("2026-05-01T12:00:00.000Z"),
        updatedAt: new Date("2026-05-01T12:00:00.000Z"),
      },
      {
        id: "location-3",
        accountId: "account-2",
        name: "Arms room",
        createdAt: new Date("2026-05-01T12:00:00.000Z"),
        updatedAt: new Date("2026-05-01T12:00:00.000Z"),
      },
    ]);

    await expect(
      searchLocations({
        accountId: "account-1",
        query: "arms",
        repository,
      }),
    ).resolves.toMatchObject([
      {
        id: "location-1",
        name: "Arms room",
      },
    ]);
  });

  it("returns no location suggestions for blank searches", async () => {
    const repository = new InMemoryLocationRepository([
      {
        id: "location-1",
        accountId: "account-1",
        name: "Arms room",
        createdAt: new Date("2026-05-01T12:00:00.000Z"),
        updatedAt: new Date("2026-05-01T12:00:00.000Z"),
      },
    ]);

    await expect(
      searchLocations({
        accountId: "account-1",
        query: "   ",
        repository,
      }),
    ).resolves.toEqual([]);
  });
});
