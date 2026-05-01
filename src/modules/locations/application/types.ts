export type LocationRecord = {
  id: string;
  accountId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

export type NewLocationRecord = {
  id: string;
  accountId: string;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
};
