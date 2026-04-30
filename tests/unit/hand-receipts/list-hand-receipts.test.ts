import { describe, expect, it } from "vitest";

import {
  listActiveHandReceipts,
  listArchivedHandReceipts,
  listHandReceipts,
} from "@/modules/hand-receipts";
import { InMemoryHandReceiptRepository } from "../../support/hand-receipt-repository";

describe("listActiveHandReceipts", () => {
  it("returns active hand receipts for an account and excludes archived records", async () => {
    const repository = new InMemoryHandReceiptRepository([
      {
        id: "archived-1",
        accountId: "account-1",
        name: "Archived",
        notes: null,
        handReceiptNumber: null,
        holderName: null,
        unitName: null,
        uic: null,
        effectiveDate: null,
        status: "archived",
        createdAt: new Date("2026-04-30T10:00:00.000Z"),
        updatedAt: new Date("2026-04-30T10:00:00.000Z"),
      },
      {
        id: "active-1",
        accountId: "account-1",
        name: "Main arms room",
        notes: null,
        handReceiptNumber: null,
        holderName: null,
        unitName: null,
        uic: null,
        effectiveDate: null,
        status: "active",
        createdAt: new Date("2026-04-30T11:00:00.000Z"),
        updatedAt: new Date("2026-04-30T11:00:00.000Z"),
      },
      {
        id: "other-account",
        accountId: "account-2",
        name: "Other owner",
        notes: null,
        handReceiptNumber: null,
        holderName: null,
        unitName: null,
        uic: null,
        effectiveDate: null,
        status: "active",
        createdAt: new Date("2026-04-30T12:00:00.000Z"),
        updatedAt: new Date("2026-04-30T12:00:00.000Z"),
      },
    ]);

    await expect(
      listActiveHandReceipts({
        accountId: "account-1",
        repository,
      }),
    ).resolves.toMatchObject([
      {
        id: "active-1",
        name: "Main arms room",
      },
    ]);
  });

  it("returns an empty list when an account has no active hand receipts", async () => {
    await expect(
      listActiveHandReceipts({
        accountId: "account-1",
        repository: new InMemoryHandReceiptRepository(),
      }),
    ).resolves.toEqual([]);
  });

  it("returns archived hand receipts for the deliberate review path", async () => {
    const repository = new InMemoryHandReceiptRepository([
      {
        id: "archived-1",
        accountId: "account-1",
        name: "Archived",
        notes: null,
        handReceiptNumber: null,
        holderName: null,
        unitName: null,
        uic: null,
        effectiveDate: null,
        status: "archived",
        createdAt: new Date("2026-04-30T10:00:00.000Z"),
        updatedAt: new Date("2026-04-30T10:00:00.000Z"),
      },
      {
        id: "active-1",
        accountId: "account-1",
        name: "Main arms room",
        notes: null,
        handReceiptNumber: null,
        holderName: null,
        unitName: null,
        uic: null,
        effectiveDate: null,
        status: "active",
        createdAt: new Date("2026-04-30T11:00:00.000Z"),
        updatedAt: new Date("2026-04-30T11:00:00.000Z"),
      },
    ]);

    await expect(
      listArchivedHandReceipts({
        accountId: "account-1",
        repository,
      }),
    ).resolves.toMatchObject([
      {
        id: "archived-1",
        status: "archived",
      },
    ]);
  });

  it("can deliberately return all hand receipts for lifecycle review", async () => {
    const repository = new InMemoryHandReceiptRepository([
      {
        id: "archived-1",
        accountId: "account-1",
        name: "Archived",
        notes: null,
        handReceiptNumber: null,
        holderName: null,
        unitName: null,
        uic: null,
        effectiveDate: null,
        status: "archived",
        createdAt: new Date("2026-04-30T10:00:00.000Z"),
        updatedAt: new Date("2026-04-30T10:00:00.000Z"),
      },
      {
        id: "active-1",
        accountId: "account-1",
        name: "Main arms room",
        notes: null,
        handReceiptNumber: null,
        holderName: null,
        unitName: null,
        uic: null,
        effectiveDate: null,
        status: "active",
        createdAt: new Date("2026-04-30T11:00:00.000Z"),
        updatedAt: new Date("2026-04-30T11:00:00.000Z"),
      },
    ]);

    await expect(
      listHandReceipts({
        accountId: "account-1",
        status: "all",
        repository,
      }),
    ).resolves.toMatchObject([
      {
        id: "active-1",
      },
      {
        id: "archived-1",
      },
    ]);
  });
});
