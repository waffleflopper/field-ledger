import type {
  ItemRecord,
  ItemRepository,
  ItemStatus,
  NewItemRecord,
  UpdateItemRecord,
} from "@/modules/items";

export class InMemoryItemRepository implements ItemRepository {
  items: ItemRecord[] = [];

  constructor(items: ItemRecord[] = []) {
    this.items = [...items];
  }

  async create(item: NewItemRecord) {
    const createdItem: ItemRecord = {
      createdAt: item.createdAt ?? new Date(),
      updatedAt: item.updatedAt ?? new Date(),
      ...item,
    };

    this.items.push(createdItem);
    return createdItem;
  }

  async findByAccountId(
    accountId: string,
    options: { status?: ItemStatus; handReceiptId?: string } = {},
  ) {
    return this.items
      .filter((item) => item.accountId === accountId)
      .filter(
        (item) =>
          options.status === undefined || item.status === options.status,
      )
      .filter(
        (item) =>
          options.handReceiptId === undefined ||
          item.handReceiptId === options.handReceiptId,
      )
      .sort(
        (left, right) => right.createdAt.getTime() - left.createdAt.getTime(),
      );
  }

  async findById(accountId: string, itemId: string) {
    return (
      this.items.find(
        (item) => item.accountId === accountId && item.id === itemId,
      ) ?? null
    );
  }

  async findByHandReceiptId(
    accountId: string,
    handReceiptId: string,
    options: { status?: ItemStatus } = {},
  ) {
    return this.findByAccountId(accountId, {
      handReceiptId,
      ...(options.status ? { status: options.status } : {}),
    });
  }

  async update(accountId: string, itemId: string, updates: UpdateItemRecord) {
    const index = this.items.findIndex(
      (item) => item.accountId === accountId && item.id === itemId,
    );

    if (index === -1) {
      return null;
    }

    const existing = this.items[index];

    if (!existing) {
      return null;
    }

    const updatedItem = {
      ...existing,
      ...updates,
      updatedAt: updates.updatedAt ?? new Date(),
    };

    this.items[index] = updatedItem;
    return updatedItem;
  }

  async findByEcn(accountId: string, ecn: string) {
    return this.items.filter(
      (item) => item.accountId === accountId && item.ecn === ecn,
    );
  }

  async findBySerialNumber(accountId: string, serialNumber: string) {
    return this.items.filter(
      (item) =>
        item.accountId === accountId && item.serialNumber === serialNumber,
    );
  }

  async countActiveByAccountId(accountId: string) {
    return this.items.filter(
      (item) => item.accountId === accountId && item.status === "active",
    ).length;
  }

  async countActiveByHandReceiptId(accountId: string, handReceiptId: string) {
    return this.items.filter(
      (item) =>
        item.accountId === accountId &&
        item.handReceiptId === handReceiptId &&
        item.status === "active",
    ).length;
  }
}

export function createEmptyItemRepository() {
  return new InMemoryItemRepository();
}
