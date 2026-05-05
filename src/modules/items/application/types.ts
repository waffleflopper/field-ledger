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
  locationId?: string | null;
  locationName?: string | null;
  active2062Coverage?: {
    assignmentId: string;
    contactId: string;
    contactName: string;
    documentId: string;
    documentFilename: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
};

export type NewItemRecord = Omit<
  ItemRecord,
  "createdAt" | "updatedAt" | "signedToContactName" | "locationName"
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
    | "locationId"
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

export type SearchableItemField =
  | "ecn"
  | "serialNumber"
  | "generatedId"
  | "nomenclature"
  | "handReceiptName"
  | "contact"
  | "location";

export type ItemSearchInput = {
  query: string;
  includeArchived?: boolean;
};

export type ItemSearchResult = {
  item: ItemRecord;
  handReceipt: {
    id: string;
    name: string;
    status: "active" | "archived";
  };
  contact: {
    id: string;
    displayName: string;
  } | null;
  location: {
    id: string;
    name: string;
  } | null;
  matchedFields: SearchableItemField[];
};

type DashboardSignedOutRowBase = {
  itemId: string;
  nomenclature: string;
  identifier: string;
  handReceiptId: string;
  handReceiptName: string;
  signedToName: string;
};

export type DashboardManualSignedOutRow = DashboardSignedOutRowBase & {
  coverageType: "manual";
  assignmentId: null;
  documentFilename: null;
};

export type Dashboard2062SignedOutRow = DashboardSignedOutRowBase & {
  coverageType: "da2062";
  assignmentId: string;
  documentFilename: string;
};

export type DashboardSignedOutRow =
  | DashboardManualSignedOutRow
  | Dashboard2062SignedOutRow;

export type DashboardSignedOutResult = {
  manualItems: DashboardManualSignedOutRow[];
  coveredItems: Dashboard2062SignedOutRow[];
};
