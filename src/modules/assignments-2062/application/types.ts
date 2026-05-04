export type AssignmentStatus = "active" | "closed";

export type AssignmentRecord = {
  id: string;
  accountId: string;
  handReceiptId: string;
  contactId: string;
  contactName?: string | null;
  documentId: string;
  documentFilename?: string | null;
  status: AssignmentStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type AssignmentItemLinkRecord = {
  id: string;
  accountId: string;
  assignmentId: string;
  itemId: string;
  status: AssignmentStatus;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CoverageHistoryEntry = {
  linkId: string;
  assignmentId: string;
  itemId: string;
  status: AssignmentStatus;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  handReceiptId: string;
  handReceiptName: string;
  contactId: string;
  contactName: string;
  documentId: string;
  documentFilename: string;
};

export type NewAssignmentRecord = Omit<
  AssignmentRecord,
  "contactName" | "documentFilename" | "createdAt" | "updatedAt"
> & {
  createdAt?: Date;
  updatedAt?: Date;
};

export type NewAssignmentItemLinkRecord = Omit<
  AssignmentItemLinkRecord,
  "createdAt" | "updatedAt"
> & {
  createdAt?: Date;
  updatedAt?: Date;
};

export type Active2062Coverage = {
  assignmentId: string;
  contactId: string;
  contactName: string;
  documentId: string;
  documentFilename: string;
};

export type ActiveAssignmentSummary = {
  id: string;
  handReceiptId: string;
  handReceiptName: string;
  contactId: string;
  contactName: string;
  documentId: string;
  documentFilename: string;
  itemCount: number;
  status: "active";
  createdAt: Date;
  updatedAt: Date;
};

export type HistoricalAssignmentLink = {
  linkId: string;
  assignmentId: string;
  handReceiptId: string;
  handReceiptName: string;
  contactId: string;
  contactName: string;
  documentId: string;
  documentFilename: string;
  closedAt: Date;
  createdAt: Date;
};

export type ItemCoverageResult = {
  current: ActiveAssignmentSummary | null;
  history: HistoricalAssignmentLink[];
};

export type CreateAssignmentInput =
  | {
      itemId: string;
      contactId: string;
      contactDisplayName?: never;
      documentId: string;
    }
  | {
      itemId: string;
      contactId?: never;
      contactDisplayName: string;
      documentId: string;
    };

export type CreateAssignmentWithItemsInput =
  | {
      handReceiptId: string;
      itemIds: string[];
      contactId: string;
      contactDisplayName?: never;
      documentId: string;
    }
  | {
      handReceiptId: string;
      itemIds: string[];
      contactId?: never;
      contactDisplayName: string;
      documentId: string;
    };

/**
 * Expected assignments-2062 failures use typed errors so API adapters can map
 * them to status codes without depending on user-facing message text. Add a
 * new typed error when callers should handle the failure deliberately; keep
 * plain Error for unexpected internal failures.
 */
export class AccountReadOnlyError extends Error {
  constructor() {
    super("This account is read-only.");
    this.name = "AccountReadOnlyError";
  }
}

export class Active2062CoverageConflictError extends Error {
  constructor() {
    super("Item already has active 2062 coverage.");
    this.name = "Active2062CoverageConflictError";
  }
}

export class ContactDisplayNameRequiredError extends Error {
  constructor() {
    super("Contact display name is required.");
    this.name = "ContactDisplayNameRequiredError";
  }
}

export class ContactNotFoundError extends Error {
  constructor() {
    super("Contact was not found.");
    this.name = "ContactNotFoundError";
  }
}

export class DocumentNotFoundError extends Error {
  constructor() {
    super("Document was not found.");
    this.name = "DocumentNotFoundError";
  }
}

export class DocumentReceiptMismatchError extends Error {
  constructor(message = "Document must belong to the hand receipt.") {
    super(message);
    this.name = "DocumentReceiptMismatchError";
  }
}

export class EmptyItemSelectionError extends Error {
  constructor() {
    super("Select at least one item.");
    this.name = "EmptyItemSelectionError";
  }
}

export class HandReceiptNotActiveError extends Error {
  constructor() {
    super("Hand receipt must be active to upload a 2062.");
    this.name = "HandReceiptNotActiveError";
  }
}

export class HandReceiptNotFoundError extends Error {
  constructor() {
    super("Hand receipt was not found.");
    this.name = "HandReceiptNotFoundError";
  }
}

export class ItemNotActiveError extends Error {
  constructor(message = "Item must be active to upload a 2062.") {
    super(message);
    this.name = "ItemNotActiveError";
  }
}

export class ItemNotFoundError extends Error {
  constructor() {
    super("Item was not found.");
    this.name = "ItemNotFoundError";
  }
}

export class ItemReceiptMismatchError extends Error {
  constructor() {
    super("Items must belong to the selected hand receipt.");
    this.name = "ItemReceiptMismatchError";
  }
}
