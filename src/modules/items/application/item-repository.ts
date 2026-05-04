import type {
  ItemSearchInput,
  ItemSearchResult,
  ItemRecord,
  ItemStatus,
  NewItemRecord,
  UpdateItemRecord,
} from "./types";

export interface ItemRepository {
  create(item: NewItemRecord): Promise<ItemRecord>;
  findByAccountId(
    accountId: string,
    options?: { status?: ItemStatus; handReceiptId?: string },
  ): Promise<ItemRecord[]>;
  findById(accountId: string, itemId: string): Promise<ItemRecord | null>;
  findManyByIds(accountId: string, itemIds: string[]): Promise<ItemRecord[]>;
  findByHandReceiptId(
    accountId: string,
    handReceiptId: string,
    options?: { status?: ItemStatus },
  ): Promise<ItemRecord[]>;
  update(
    accountId: string,
    itemId: string,
    updates: UpdateItemRecord,
  ): Promise<ItemRecord | null>;
  findByEcn(accountId: string, ecn: string): Promise<ItemRecord[]>;
  findBySerialNumber(
    accountId: string,
    serialNumber: string,
  ): Promise<ItemRecord[]>;
  countActiveByAccountId(accountId: string): Promise<number>;
  countActiveByHandReceiptId(
    accountId: string,
    handReceiptId: string,
  ): Promise<number>;
  search(
    accountId: string,
    input: ItemSearchInput,
  ): Promise<ItemSearchResult[]>;
}

export function createUnavailableItemRepository(): ItemRepository {
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
    async findManyByIds() {
      throw new Error("An authenticated database session is required.");
    },
    async findByHandReceiptId() {
      throw new Error("An authenticated database session is required.");
    },
    async update() {
      throw new Error("An authenticated database session is required.");
    },
    async findByEcn() {
      throw new Error("An authenticated database session is required.");
    },
    async findBySerialNumber() {
      throw new Error("An authenticated database session is required.");
    },
    async countActiveByAccountId() {
      throw new Error("An authenticated database session is required.");
    },
    async countActiveByHandReceiptId() {
      throw new Error("An authenticated database session is required.");
    },
    async search() {
      throw new Error("An authenticated database session is required.");
    },
  };
}
