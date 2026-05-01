import type {
  ContactRecord,
  ContactRepository,
  NewContactRecord,
} from "@/modules/contacts";

export class InMemoryContactRepository implements ContactRepository {
  contacts: ContactRecord[] = [];

  constructor(contacts: ContactRecord[] = []) {
    this.contacts = [...contacts];
  }

  async create(contact: NewContactRecord) {
    const createdContact: ContactRecord = {
      createdAt: contact.createdAt ?? new Date(),
      updatedAt: contact.updatedAt ?? new Date(),
      ...contact,
    };

    this.contacts.push(createdContact);
    return createdContact;
  }

  async findByAccountId(accountId: string) {
    return this.contacts
      .filter((contact) => contact.accountId === accountId)
      .sort((left, right) => left.displayName.localeCompare(right.displayName));
  }

  async findById(accountId: string, contactId: string) {
    return (
      this.contacts.find(
        (contact) =>
          contact.accountId === accountId && contact.id === contactId,
      ) ?? null
    );
  }

  async searchByName(accountId: string, query: string) {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    return this.contacts
      .filter((contact) => contact.accountId === accountId)
      .filter(
        (contact) =>
          normalizedQuery.length === 0 ||
          contact.displayName.toLocaleLowerCase().startsWith(normalizedQuery),
      )
      .sort((left, right) => left.displayName.localeCompare(right.displayName))
      .slice(0, 10);
  }
}

export function createEmptyContactRepository() {
  return new InMemoryContactRepository();
}
