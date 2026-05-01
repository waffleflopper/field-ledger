import type { ContactRecord, NewContactRecord } from "./types";

export interface ContactRepository {
  create(contact: NewContactRecord): Promise<ContactRecord>;
  findByAccountId(accountId: string): Promise<ContactRecord[]>;
  findById(accountId: string, contactId: string): Promise<ContactRecord | null>;
  searchByName(accountId: string, query: string): Promise<ContactRecord[]>;
}

export function createUnavailableContactRepository(): ContactRepository {
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
  };
}
