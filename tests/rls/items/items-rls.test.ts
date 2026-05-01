import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:54332/postgres";

const ownerOneId = "better-auth-items-owner-one";
const ownerTwoId = "better-auth-items-owner-two";
const ownerOneAccountId = "3bdb95df-9de6-441a-a6d9-4593518f1230";
const ownerTwoAccountId = "d29ed938-f5f0-4de9-87d9-2255141f6ad1";
const ownerOneHandReceiptId = "4a2980ad-dbbe-4f01-8177-feafab91808f";
const ownerTwoHandReceiptId = "ab6d5ac4-0b79-40ef-bd51-359005c992b5";
const ownerOneItemId = "8d0751a5-53a7-4284-8aa5-50448ffd210b";
const ownerTwoItemId = "d75d214e-f428-40e2-87e3-c3de7f037cb8";
const ownerOneInsertAllowedItemId = "961b8bf3-7b61-4e8a-a2fa-8340a42298fd";

const sql = postgres(databaseUrl, { max: 1 });

async function asAuthenticatedOwner<T>(
  authSubject: string,
  query: (transaction: postgres.TransactionSql) => Promise<T>,
) {
  return sql.begin(async (transaction) => {
    await transaction`set local role authenticated`;
    await transaction`select set_config('app.current_auth_subject', ${authSubject}, true)`;

    return query(transaction);
  });
}

describe("items RLS", () => {
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

    await sql`insert into items ${sql([
      {
        id: ownerOneItemId,
        account_id: ownerOneAccountId,
        hand_receipt_id: ownerOneHandReceiptId,
        nomenclature: "Owner one item",
        ecn: "ECN-ONE",
      },
      {
        id: ownerTwoItemId,
        account_id: ownerTwoAccountId,
        hand_receipt_id: ownerTwoHandReceiptId,
        nomenclature: "Owner two item",
        ecn: "ECN-TWO",
      },
    ])} on conflict (id) do nothing`;
  });

  afterAll(async () => {
    await sql`delete from items where id in (${ownerOneItemId}, ${ownerTwoItemId}, ${ownerOneInsertAllowedItemId})`;
    await sql`delete from hand_receipts where id in (${ownerOneHandReceiptId}, ${ownerTwoHandReceiptId})`;
    await sql`delete from accounts where id in (${ownerOneAccountId}, ${ownerTwoAccountId})`;
    await sql.end();
  });

  it("allows an owner to read their own items", async () => {
    const rows = await asAuthenticatedOwner(
      ownerOneId,
      async (transaction) =>
        transaction`select id from items where account_id = ${ownerOneAccountId}`,
    );

    expect(rows).toEqual([{ id: ownerOneItemId }]);
  });

  it("prevents an owner from reading another account's items", async () => {
    const rows = await asAuthenticatedOwner(
      ownerOneId,
      async (transaction) =>
        transaction`select id from items where account_id = ${ownerTwoAccountId}`,
    );

    expect(rows).toEqual([]);
  });

  it("allows an owner to insert items for their own account", async () => {
    await expect(
      asAuthenticatedOwner(
        ownerOneId,
        async (transaction) =>
          transaction`insert into items (
            id,
            account_id,
            hand_receipt_id,
            nomenclature,
            generated_id
          ) values (
            ${ownerOneInsertAllowedItemId},
            ${ownerOneAccountId},
            ${ownerOneHandReceiptId},
            'Allowed item',
            'FL-000099'
          )`,
      ),
    ).resolves.not.toThrow();
  });

  it("prevents an owner from inserting items for another account", async () => {
    await expect(
      asAuthenticatedOwner(
        ownerOneId,
        async (transaction) =>
          transaction`insert into items (
            account_id,
            hand_receipt_id,
            nomenclature,
            generated_id
          ) values (
            ${ownerTwoAccountId},
            ${ownerTwoHandReceiptId},
            'Blocked item',
            'FL-000100'
          )`,
      ),
    ).rejects.toThrow();
  });

  it("prevents an owner from linking an item to another account's hand receipt", async () => {
    await expect(
      asAuthenticatedOwner(
        ownerOneId,
        async (transaction) =>
          transaction`insert into items (
            account_id,
            hand_receipt_id,
            nomenclature,
            generated_id
          ) values (
            ${ownerOneAccountId},
            ${ownerTwoHandReceiptId},
            'Cross receipt item',
            'FL-000101'
          )`,
      ),
    ).rejects.toThrow();
  });

  it("allows an owner to update their own items", async () => {
    await expect(
      asAuthenticatedOwner(
        ownerOneId,
        async (transaction) =>
          transaction`update items set nomenclature = 'Updated owner item' where id = ${ownerOneItemId} returning id`,
      ),
    ).resolves.toEqual([{ id: ownerOneItemId }]);
  });

  it("prevents an owner from updating another account's items", async () => {
    const rows = await asAuthenticatedOwner(
      ownerOneId,
      async (transaction) =>
        transaction`update items set nomenclature = 'Blocked update' where id = ${ownerTwoItemId} returning id`,
    );

    expect(rows).toEqual([]);
  });
});
