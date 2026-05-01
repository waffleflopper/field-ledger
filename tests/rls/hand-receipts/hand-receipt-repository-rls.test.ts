import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createDrizzleHandReceiptRepository } from "@/modules/hand-receipts/infrastructure/drizzle-hand-receipt-repository";
import { createDrizzleClient } from "@/modules/provider-boundaries/database/drizzle";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:54332/postgres";

const ownerOneId = "better-auth-hand-receipt-repository-owner-one";
const ownerTwoId = "better-auth-hand-receipt-repository-owner-two";
const ownerOneAccountId = "be1fe9d8-28a8-4318-a6e5-05ed4bb77f3f";
const ownerTwoAccountId = "fcb3b113-5a8a-42d2-9898-57ec373a3d37";
const ownerOneHandReceiptId = "8f967028-14cc-4173-ab82-6a9e5333f409";
const ownerTwoHandReceiptId = "70d06aaa-c395-4d27-a7e5-61dc5e962a8d";

const sql = postgres(databaseUrl, { max: 1 });
const db = createDrizzleClient(databaseUrl);

describe("hand receipt repository RLS boundary", () => {
  beforeAll(async () => {
    await sql`insert into accounts ${sql([
      {
        id: ownerOneAccountId,
        auth_user_id: ownerOneId,
        access_state: "trialing",
        trial_starts_at: new Date("2026-04-30T12:00:00.000Z"),
        trial_ends_at: new Date("2026-05-30T12:00:00.000Z"),
      },
      {
        id: ownerTwoAccountId,
        auth_user_id: ownerTwoId,
        access_state: "trialing",
        trial_starts_at: new Date("2026-04-30T12:00:00.000Z"),
        trial_ends_at: new Date("2026-05-30T12:00:00.000Z"),
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
    ])} on conflict (id) do nothing`;
  });

  afterAll(async () => {
    await sql`delete from audit_events where target_id in (${ownerOneHandReceiptId}, ${ownerTwoHandReceiptId})`;
    await sql`delete from hand_receipts where id in (${ownerOneHandReceiptId}, ${ownerTwoHandReceiptId})`;
    await sql`delete from accounts where id in (${ownerOneAccountId}, ${ownerTwoAccountId})`;
    await sql.end();
  });

  it("lists only rows allowed by the authenticated database session", async () => {
    const repository = createDrizzleHandReceiptRepository(db, {
      authSubject: ownerOneId,
    });

    await expect(
      repository.findByAccountId(ownerOneAccountId, { status: "active" }),
    ).resolves.toMatchObject([
      {
        id: ownerOneHandReceiptId,
      },
    ]);

    await expect(
      repository.findByAccountId(ownerTwoAccountId, { status: "active" }),
    ).resolves.toEqual([]);
  });

  it("cannot create hand receipts for another account through the repository", async () => {
    const repository = createDrizzleHandReceiptRepository(db, {
      authSubject: ownerOneId,
    });

    await expect(
      repository.create({
        accountId: ownerTwoAccountId,
        name: "Blocked receipt",
        notes: null,
        handReceiptNumber: null,
        holderName: null,
        unitName: null,
        uic: null,
        effectiveDate: null,
        status: "active",
      }),
    ).rejects.toThrow();
  });

  it("updates only rows allowed by the authenticated database session", async () => {
    const repository = createDrizzleHandReceiptRepository(db, {
      authSubject: ownerOneId,
    });

    await expect(
      repository.update(ownerOneAccountId, ownerOneHandReceiptId, {
        name: "Updated owner one receipt",
      }),
    ).resolves.toMatchObject({
      id: ownerOneHandReceiptId,
      name: "Updated owner one receipt",
    });

    await expect(
      repository.update(ownerTwoAccountId, ownerTwoHandReceiptId, {
        name: "Blocked owner two update",
      }),
    ).resolves.toBeNull();
  });
});
