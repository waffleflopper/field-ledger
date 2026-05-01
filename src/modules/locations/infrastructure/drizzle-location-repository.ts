import { and, asc, eq, ilike } from "drizzle-orm";

import { locations } from "@/db/schema";
import type { LocationRepository } from "@/modules/locations";
import type { LocationRecord } from "@/modules/locations/application/types";
import type {
  AuthenticatedDatabaseSession,
  AuthenticatedDatabaseTransaction,
} from "@/modules/provider-boundaries/database/authenticated-session";
import { runWithAuthenticatedDatabaseSession } from "@/modules/provider-boundaries/database/authenticated-session";
import type { createDrizzleClient } from "@/modules/provider-boundaries/database/drizzle";

type DrizzleClient = ReturnType<typeof createDrizzleClient>;
type LocationRow = typeof locations.$inferSelect;
type LocationOperation = <T>(
  operation: (transaction: AuthenticatedDatabaseTransaction) => Promise<T>,
) => Promise<T>;

function toLocationRecord(row: LocationRow): LocationRecord {
  return {
    id: row.id,
    accountId: row.accountId,
    name: row.name,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function createLocationRepository(run: LocationOperation): LocationRepository {
  return {
    async create(location) {
      const createdLocation = await run(async (transaction) => {
        const [created] = await transaction
          .insert(locations)
          .values(location)
          .returning();

        if (!created) {
          throw new Error("Location was not created.");
        }

        return created;
      });

      return toLocationRecord(createdLocation);
    },
    async findByAccountId(accountId) {
      const rows = await run((transaction) =>
        transaction
          .select()
          .from(locations)
          .where(eq(locations.accountId, accountId))
          .orderBy(asc(locations.name)),
      );

      return rows.map(toLocationRecord);
    },
    async findById(accountId, locationId) {
      const [row] = await run((transaction) =>
        transaction
          .select()
          .from(locations)
          .where(
            and(
              eq(locations.accountId, accountId),
              eq(locations.id, locationId),
            ),
          )
          .limit(1),
      );

      return row ? toLocationRecord(row) : null;
    },
    async searchByName(accountId, query) {
      const trimmed = query.trim();
      const rows = await run((transaction) =>
        transaction
          .select()
          .from(locations)
          .where(
            trimmed
              ? and(
                  eq(locations.accountId, accountId),
                  ilike(locations.name, `${trimmed}%`),
                )
              : eq(locations.accountId, accountId),
          )
          .orderBy(asc(locations.name))
          .limit(10),
      );

      return rows.map(toLocationRecord);
    },
  };
}

export function createDrizzleLocationRepository(
  db: DrizzleClient,
  session: AuthenticatedDatabaseSession,
): LocationRepository {
  return createLocationRepository((operation) =>
    runWithAuthenticatedDatabaseSession(db, session, operation),
  );
}

export function createTransactionalDrizzleLocationRepository(
  transaction: AuthenticatedDatabaseTransaction,
): LocationRepository {
  return createLocationRepository((operation) => operation(transaction));
}
