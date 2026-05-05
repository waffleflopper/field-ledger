import type { LocationRecord, NewLocationRecord } from "./types";

export interface LocationRepository {
  create(location: NewLocationRecord): Promise<LocationRecord>;
  findByAccountId(accountId: string): Promise<LocationRecord[]>;
  findById(
    accountId: string,
    locationId: string,
  ): Promise<LocationRecord | null>;
  searchByName(accountId: string, query: string): Promise<LocationRecord[]>;
  update(
    accountId: string,
    locationId: string,
    values: Partial<Pick<LocationRecord, "archivedAt" | "name" | "updatedAt">>,
  ): Promise<LocationRecord | null>;
}

export function createUnavailableLocationRepository(): LocationRepository {
  return {
    async create() {
      throw new Error("An authenticated database session is required.");
    },
    async findByAccountId() {
      throw new Error("An authenticated database session is required.");
    },
    async findById() {
      throw new Error("An authenticated database session is required.");
    },
    async searchByName() {
      throw new Error("An authenticated database session is required.");
    },
    async update() {
      throw new Error("An authenticated database session is required.");
    },
  };
}
