export type ItemStatus = "active" | "archived";

export type ItemRecord = {
  id: string;
  accountId: string;
  handReceiptId: string;
  nomenclature: string;
  ecn: string | null;
  serialNumber: string | null;
  generatedId: string | null;
  notes: string | null;
  status: ItemStatus;
  signedToContactId?: string | null;
  signedToContactName?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type NewItemRecord = Omit<
  ItemRecord,
  "createdAt" | "updatedAt" | "signedToContactName"
> & {
  createdAt?: Date;
  updatedAt?: Date;
};

export type UpdateItemRecord = Partial<
  Pick<
    ItemRecord,
    | "handReceiptId"
    | "nomenclature"
    | "ecn"
    | "serialNumber"
    | "generatedId"
    | "notes"
    | "status"
    | "signedToContactId"
    | "updatedAt"
  >
>;

export type DuplicateCheckResult = {
  hasDuplicate: boolean;
  existingItems: ItemRecord[];
};

export type CreateItemResult =
  | {
      item: ItemRecord;
      duplicateWarning?: never;
    }
  | {
      item?: never;
      duplicateWarning: DuplicateCheckResult;
    };

export type UpdateItemResult =
  | {
      item: ItemRecord | null;
      duplicateWarning?: never;
    }
  | {
      item?: never;
      duplicateWarning: DuplicateCheckResult;
    };
