export type HandReceiptStatus = "active" | "archived";

export type HandReceiptMetadataInput = {
  notes?: string | null;
  handReceiptNumber?: string | null;
  holderName?: string | null;
  unitName?: string | null;
  uic?: string | null;
  effectiveDate?: string | null;
};

export type HandReceiptRecord = {
  id: string;
  accountId: string;
  name: string;
  notes: string | null;
  handReceiptNumber: string | null;
  holderName: string | null;
  unitName: string | null;
  uic: string | null;
  effectiveDate: string | null;
  status: HandReceiptStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type NewHandReceiptRecord = Omit<
  HandReceiptRecord,
  "id" | "createdAt" | "updatedAt"
> & {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
};
