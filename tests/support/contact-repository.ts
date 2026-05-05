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
      ...contact,
      archivedAt: contact.archivedAt ?? null,
      createdAt: contact.createdAt ?? new Date(),
      updatedAt: contact.updatedAt ?? new Date(),
    };

    this.contacts.push(createdContact);
    return createdContact;
  }

  async findByAccountId(accountId: string) {
    return this.contacts
      .filter(
        (contact) =>
          contact.accountId === accountId && contact.archivedAt == null,
      )
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
      .filter(
        (contact) =>
          contact.accountId === accountId && contact.archivedAt == null,
      )
      .filter(
        (contact) =>
          normalizedQuery.length === 0 ||
          contact.displayName.toLocaleLowerCase().startsWith(normalizedQuery),
      )
      .sort((left, right) => left.displayName.localeCompare(right.displayName))
      .slice(0, 10);
  }

  async update(
    accountId: string,
    contactId: string,
    values: Partial<
      Pick<ContactRecord, "archivedAt" | "displayName" | "updatedAt">
    >,
  ) {
    const index = this.contacts.findIndex(
      (contact) => contact.accountId === accountId && contact.id === contactId,
    );

    if (index === -1) {
      return null;
    }

    const updated: ContactRecord = {
      ...this.contacts[index]!,
      ...values,
    };

    this.contacts[index] = updated;
    return updated;
  }
}

export function createEmptyContactRepository() {
  return new InMemoryContactRepository();
}
