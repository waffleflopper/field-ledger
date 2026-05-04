import type {
  ItemSearchInput,
  ItemSearchResult,
  ItemRecord,
  ItemRepository,
  ItemStatus,
  NewItemRecord,
  UpdateItemRecord,
} from "@/modules/items";
import {
  getMatchedItemSearchFields,
  normalizeItemSearchQuery,
} from "@/modules/items";
import type { InMemoryHandReceiptRepository } from "./hand-receipt-repository";

export class InMemoryItemRepository implements ItemRepository {
  items: ItemRecord[] = [];
  handReceiptRepository: InMemoryHandReceiptRepository | null = null;

  constructor(
    items: ItemRecord[] = [],
    handReceiptRepository: InMemoryHandReceiptRepository | null = null,
  ) {
    this.items = [...items];
    this.handReceiptRepository = handReceiptRepository;
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

  async findManyByIds(accountId: string, itemIds: string[]) {
    const itemIdSet = new Set(itemIds);

    return this.items.filter(
      (item) => item.accountId === accountId && itemIdSet.has(item.id),
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

  async search(accountId: string, input: ItemSearchInput) {
    const normalizedQuery = normalizeItemSearchQuery(input.query);

    if (normalizedQuery.length === 0) {
      return [];
    }

    const handReceipts =
      this.handReceiptRepository?.handReceipts.filter(
        (handReceipt) => handReceipt.accountId === accountId,
      ) ?? [];

    const results: ItemSearchResult[] = [];

    for (const item of this.items) {
      if (item.accountId !== accountId) {
        continue;
      }

      const handReceipt = handReceipts.find(
        (candidate) => candidate.id === item.handReceiptId,
      );

      if (
        !handReceipt ||
        (!input.includeArchived && handReceipt.status === "archived")
      ) {
        continue;
      }

      if (!input.includeArchived && item.status === "archived") {
        continue;
      }

      const matchedFields = getMatchedItemSearchFields(
        {
          ecn: item.ecn,
          serialNumber: item.serialNumber,
          generatedId: item.generatedId,
          nomenclature: item.nomenclature,
          handReceiptName: handReceipt.name,
          contact: item.signedToContactName,
          location: item.locationName,
        },
        normalizedQuery,
      );

      if (matchedFields.length === 0) {
        continue;
      }

      results.push({
        item,
        handReceipt: {
          id: handReceipt.id,
          name: handReceipt.name,
          status: handReceipt.status,
        },
        contact:
          item.signedToContactId && item.signedToContactName
            ? {
                id: item.signedToContactId,
                displayName: item.signedToContactName,
              }
            : null,
        location:
          item.locationId && item.locationName
            ? {
                id: item.locationId,
                name: item.locationName,
              }
            : null,
        matchedFields,
      });
    }

    return results
      .sort(
        (left, right) =>
          right.item.updatedAt.getTime() - left.item.updatedAt.getTime(),
      )
      .slice(0, 50);
  }
}

export function createEmptyItemRepository() {
  return new InMemoryItemRepository();
}
