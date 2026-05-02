import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createDrizzleClient } from "@/modules/provider-boundaries/database/drizzle";
import { createDrizzleRequirementRepository } from "@/modules/requirements/infrastructure/drizzle-requirement-repository";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:54332/postgres";

const ownerOneId = "better-auth-requirement-repository-owner-one";
const ownerTwoId = "better-auth-requirement-repository-owner-two";
const ownerOneAccountId = "7d4cf06f-fef6-4644-8a36-81984b997fa9";
const ownerTwoAccountId = "3e5b9be9-e12b-4817-8527-1a37f9401b2c";
const ownerOneHandReceiptId = "e6d25f50-7f37-4f6d-a571-75347643ebf2";
const ownerOneArchivedHandReceiptId = "78046362-df47-4fc2-9279-a86810d57cfe";
const ownerTwoHandReceiptId = "b8640095-728f-4d90-a412-82746c208758";
const ownerOneItemId = "196e3b1c-3d2f-4971-8ea3-40126255e608";
const ownerOneArchivedItemId = "66ebc1e2-29be-4780-98e9-4483b0b9e351";
const ownerOneItemOnArchivedHandReceiptId =
  "4f03434a-7c33-40bb-9d40-b545a1f7e5c3";
const ownerTwoItemId = "8c2b0ce5-975f-448d-b744-37bdaecb50e3";
const ownerOneRequirementId = "857a2392-2243-4011-864d-e225e6100e18";
const ownerOneArchivedItemRequirementId =
  "38d9a9f3-6b53-4d43-9b32-cc35706e038e";
const ownerOneArchivedReceiptRequirementId =
  "3e990cdf-f8bc-425c-9747-a37f3dcf339c";
const ownerTwoRequirementId = "7405e518-c619-4313-ba83-24bd70cff8c8";

const sql = postgres(databaseUrl, { max: 1 });
const db = createDrizzleClient(databaseUrl);

describe("requirement repository RLS boundary", () => {
  beforeAll(async () => {
    await sql`insert into accounts ${sql([
      {
        id: ownerOneAccountId,
        auth_user_id: ownerOneId,
        access_state: "trialing",
        trial_starts_at: new Date("2026-05-01T12:00:00.000Z"),
        trial_ends_at: new Date("2026-05-31T12:00:00.000Z"),
      },
      {
        id: ownerTwoAccountId,
        auth_user_id: ownerTwoId,
        access_state: "trialing",
        trial_starts_at: new Date("2026-05-01T12:00:00.000Z"),
        trial_ends_at: new Date("2026-05-31T12:00:00.000Z"),
      },
    ])} on conflict (auth_user_id) do update set access_state = excluded.access_state`;

    await sql`insert into hand_receipts ${sql([
      {
        id: ownerOneHandReceiptId,
        account_id: ownerOneAccountId,
        name: "Owner one receipt",
      },
      {
        id: ownerTwoHandReceiptId,
        account_id: ownerTwoAccountId,
        name: "Owner two receipt",
      },
      {
        id: ownerOneArchivedHandReceiptId,
        account_id: ownerOneAccountId,
        name: "Archived owner one receipt",
        status: "archived",
      },
    ])} on conflict (id) do nothing`;
    await sql`update hand_receipts set status = 'archived' where id = ${ownerOneArchivedHandReceiptId}`;

    await sql`insert into items ${sql([
      {
        id: ownerOneItemId,
        account_id: ownerOneAccountId,
        hand_receipt_id: ownerOneHandReceiptId,
        nomenclature: "Owner one item",
        ecn: "REQ-REPO-ONE",
      },
      {
        id: ownerTwoItemId,
        account_id: ownerTwoAccountId,
        hand_receipt_id: ownerTwoHandReceiptId,
        nomenclature: "Owner two item",
        ecn: "REQ-REPO-TWO",
      },
      {
        id: ownerOneArchivedItemId,
        account_id: ownerOneAccountId,
        hand_receipt_id: ownerOneHandReceiptId,
        nomenclature: "Archived owner one item",
        ecn: "REQ-REPO-ARCHIVED-ITEM",
        status: "archived",
      },
      {
        id: ownerOneItemOnArchivedHandReceiptId,
        account_id: ownerOneAccountId,
        hand_receipt_id: ownerOneArchivedHandReceiptId,
        nomenclature: "Owner one item on archived receipt",
        ecn: "REQ-REPO-ARCHIVED-RECEIPT",
      },
    ])} on conflict (id) do nothing`;
    await sql`update items set status = 'active' where id in (${ownerOneItemId}, ${ownerTwoItemId}, ${ownerOneItemOnArchivedHandReceiptId})`;
    await sql`update items set status = 'archived' where id = ${ownerOneArchivedItemId}`;

    await sql`insert into requirements ${sql([
      {
        id: ownerOneRequirementId,
        account_id: ownerOneAccountId,
        item_id: ownerOneItemId,
        name: "Owner one existing check",
        interval_type: "monthly",
        next_due_date: "2026-06-01",
      },
      {
        id: ownerOneArchivedItemRequirementId,
        account_id: ownerOneAccountId,
        item_id: ownerOneArchivedItemId,
        name: "Archived item check",
        interval_type: "monthly",
        next_due_date: "2026-06-01",
      },
      {
        id: ownerOneArchivedReceiptRequirementId,
        account_id: ownerOneAccountId,
        item_id: ownerOneItemOnArchivedHandReceiptId,
        name: "Archived receipt check",
        interval_type: "monthly",
        next_due_date: "2026-06-01",
      },
      {
        id: ownerTwoRequirementId,
        account_id: ownerTwoAccountId,
        item_id: ownerTwoItemId,
        name: "Owner two check",
        interval_type: "monthly",
        next_due_date: "2026-06-01",
      },
    ])} on conflict (id) do nothing`;
  });

  afterAll(async () => {
    await sql`delete from requirements where account_id in (${ownerOneAccountId}, ${ownerTwoAccountId})`;
    await sql`delete from items where id in (${ownerOneItemId}, ${ownerTwoItemId}, ${ownerOneArchivedItemId}, ${ownerOneItemOnArchivedHandReceiptId})`;
    await sql`delete from hand_receipts where id in (${ownerOneHandReceiptId}, ${ownerTwoHandReceiptId}, ${ownerOneArchivedHandReceiptId})`;
    await sql`delete from accounts where id in (${ownerOneAccountId}, ${ownerTwoAccountId})`;
    await sql.end();
  });

  it("creates and reads only requirements allowed by the authenticated session", async () => {
    const repository = createDrizzleRequirementRepository(db, {
      authSubject: ownerOneId,
    });

    const created = await repository.create({
      accountId: ownerOneAccountId,
      itemId: ownerOneItemId,
      name: "Owner one check",
      intervalType: "monthly",
      intervalValue: null,
      nextDueDate: "2026-06-01",
      status: "active",
    });

    await expect(
      repository.findByItemId(ownerOneAccountId, ownerOneItemId),
    ).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: created.id })]),
    );
    await expect(
      repository.findByItemId(ownerTwoAccountId, ownerTwoItemId),
    ).resolves.toEqual([]);
  });

  it("cannot create a requirement for another account through the repository", async () => {
    const repository = createDrizzleRequirementRepository(db, {
      authSubject: ownerOneId,
    });

    await expect(
      repository.create({
        accountId: ownerTwoAccountId,
        itemId: ownerTwoItemId,
        name: "Blocked requirement",
        intervalType: "annual",
        intervalValue: null,
        nextDueDate: "2027-01-01",
        status: "active",
      }),
    ).rejects.toThrow();
  });

  it("updates only requirements allowed by the authenticated session", async () => {
    const repository = createDrizzleRequirementRepository(db, {
      authSubject: ownerOneId,
    });
    const updatedAt = new Date("2026-05-02T12:00:00.000Z");

    await expect(
      repository.update(ownerOneAccountId, ownerOneRequirementId, {
        name: "Owner one updated check",
        notes: "Updated through owner one session.",
        intervalType: "quarterly",
        intervalValue: null,
        nextDueDate: "2026-08-01",
        updatedAt,
      }),
    ).resolves.toMatchObject({
      id: ownerOneRequirementId,
      name: "Owner one updated check",
      notes: "Updated through owner one session.",
      nextDueDate: "2026-08-01",
    });
    await expect(
      repository.update(ownerTwoAccountId, ownerTwoRequirementId, {
        name: "Cross-account update",
        notes: null,
        intervalType: "annual",
        intervalValue: null,
        nextDueDate: "2027-01-01",
        updatedAt,
      }),
    ).resolves.toBeNull();
  });

  it("suppresses archived item and archived hand receipt work from dashboard requirements", async () => {
    const repository = createDrizzleRequirementRepository(db, {
      authSubject: ownerOneId,
    });

    const rows = await repository.findDashboardRequirements(ownerOneAccountId, {
      maxNextDueDate: "2026-12-31",
    });
    const requirementIds = rows.map((row) => row.requirementId);

    expect(rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          requirementId: ownerOneRequirementId,
          itemId: ownerOneItemId,
          handReceiptId: ownerOneHandReceiptId,
        }),
      ]),
    );
    expect(requirementIds).not.toContain(ownerOneArchivedItemRequirementId);
    expect(requirementIds).not.toContain(ownerOneArchivedReceiptRequirementId);
    expect(requirementIds).not.toContain(ownerTwoRequirementId);
  });
});
