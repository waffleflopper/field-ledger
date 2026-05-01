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
      createdAt: location.createdAt ?? new Date(),
      updatedAt: location.updatedAt ?? new Date(),
    };

    this.locations.push(createdLocation);
    return createdLocation;
  }

  async findByAccountId(accountId: string) {
    return this.locations
      .filter((location) => location.accountId === accountId)
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
      .filter((location) => location.accountId === accountId)
      .filter(
        (location) =>
          normalizedQuery.length === 0 ||
          location.name.toLocaleLowerCase().startsWith(normalizedQuery),
      )
      .sort((left, right) => left.name.localeCompare(right.name))
      .slice(0, 10);
  }
}

export function createEmptyLocationRepository() {
  return new InMemoryLocationRepository();
}
