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
