export type ContactRecord = {
  id: string;
  accountId: string;
  displayName: string;
  createdAt: Date;
  updatedAt: Date;
};

export type NewContactRecord = Omit<
  ContactRecord,
  "createdAt" | "updatedAt"
> & {
  createdAt?: Date;
  updatedAt?: Date;
};
