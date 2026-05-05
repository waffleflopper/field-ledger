import type {
  LocationRecord,
  LocationRepository,
  NewLocationRecord,
} from "@/modules/locations";

export class InMemoryLocationRepository implements LocationRepository {
  locations: LocationRecord[] = [];

  constructor(locations: LocationRecord[] = []) {
    this.locations = [...locations];
  }

  async create(location: NewLocationRecord) {
    const createdLocation: LocationRecord = {
      ...location,
      archivedAt: location.archivedAt ?? null,
      createdAt: location.createdAt ?? new Date(),
      updatedAt: location.updatedAt ?? new Date(),
    };

    this.locations.push(createdLocation);
    return createdLocation;
  }

  async findByAccountId(accountId: string) {
    return this.locations
      .filter(
        (location) =>
          location.accountId === accountId && location.archivedAt == null,
      )
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  async findById(accountId: string, locationId: string) {
    return (
      this.locations.find(
        (location) =>
          location.accountId === accountId && location.id === locationId,
      ) ?? null
    );
  }

  async searchByName(accountId: string, query: string) {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    return this.locations
      .filter(
        (location) =>
          location.accountId === accountId && location.archivedAt == null,
      )
      .filter(
        (location) =>
          normalizedQuery.length === 0 ||
          location.name.toLocaleLowerCase().startsWith(normalizedQuery),
      )
      .sort((left, right) => left.name.localeCompare(right.name))
      .slice(0, 10);
  }

  async update(
    accountId: string,
    locationId: string,
    values: Partial<Pick<LocationRecord, "archivedAt" | "name" | "updatedAt">>,
  ) {
    const index = this.locations.findIndex(
      (location) =>
        location.accountId === accountId && location.id === locationId,
    );

    if (index === -1) {
      return null;
    }

    const updated: LocationRecord = {
      ...this.locations[index]!,
      ...values,
    };

    this.locations[index] = updated;
    return updated;
  }
}

export function createEmptyLocationRepository() {
  return new InMemoryLocationRepository();
}
