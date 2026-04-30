import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:54332/postgres";

const ownerOneId = "better-auth-hand-receipts-owner-one";
const ownerTwoId = "better-auth-hand-receipts-owner-two";
const ownerOneAccountId = "1b6bdb8d-2202-4f00-a195-5917168807e3";
const ownerTwoAccountId = "ec6b6623-bb5d-423c-9291-5a2ed631c639";
const ownerOneHandReceiptId = "7db2eba2-c7d5-4ca6-a0d5-7c1e763c7082";
const ownerTwoHandReceiptId = "31b51b49-7831-4104-91e6-78c350a04668";
const ownerOneInsertAllowedHandReceiptId =
  "7f4a6515-75a3-4b98-94e2-3192602532eb";

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

describe("hand receipts RLS", () => {
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
    await sql`delete from hand_receipts where id in (${ownerOneHandReceiptId}, ${ownerTwoHandReceiptId}, ${ownerOneInsertAllowedHandReceiptId})`;
    await sql`delete from accounts where id in (${ownerOneAccountId}, ${ownerTwoAccountId})`;
    await sql.end();
  });

  it("allows an owner to read their own hand receipts", async () => {
    const rows = await asAuthenticatedOwner(
      ownerOneId,
      async (transaction) =>
        transaction`select id from hand_receipts where account_id = ${ownerOneAccountId}`,
    );

    expect(rows).toEqual([{ id: ownerOneHandReceiptId }]);
  });

  it("prevents an owner from reading another account's hand receipts", async () => {
    const rows = await asAuthenticatedOwner(
      ownerOneId,
      async (transaction) =>
        transaction`select id from hand_receipts where account_id = ${ownerTwoAccountId}`,
    );

    expect(rows).toEqual([]);
  });

  it("allows an owner to insert hand receipts for their own account", async () => {
    await expect(
      asAuthenticatedOwner(
        ownerOneId,
        async (transaction) =>
          transaction`insert into hand_receipts (
            id,
            account_id,
            name
          ) values (
            ${ownerOneInsertAllowedHandReceiptId},
            ${ownerOneAccountId},
            'Allowed receipt'
          )`,
      ),
    ).resolves.not.toThrow();
  });

  it("prevents an owner from inserting hand receipts for another account", async () => {
    await expect(
      asAuthenticatedOwner(
        ownerOneId,
        async (transaction) =>
          transaction`insert into hand_receipts (
            account_id,
            name
          ) values (
            ${ownerTwoAccountId},
            'Blocked receipt'
          )`,
      ),
    ).rejects.toThrow();
  });

  it("allows an owner to update their own hand receipts", async () => {
    await expect(
      asAuthenticatedOwner(
        ownerOneId,
        async (transaction) =>
          transaction`update hand_receipts set name = 'Updated owner receipt' where id = ${ownerOneHandReceiptId} returning id`,
      ),
    ).resolves.toEqual([{ id: ownerOneHandReceiptId }]);
  });

  it("prevents an owner from updating another account's hand receipts", async () => {
    const rows = await asAuthenticatedOwner(
      ownerOneId,
      async (transaction) =>
        transaction`update hand_receipts set name = 'Blocked update' where id = ${ownerTwoHandReceiptId} returning id`,
    );

    expect(rows).toEqual([]);
  });

  it("prevents an owner from moving a hand receipt to another account", async () => {
    await expect(
      asAuthenticatedOwner(
        ownerOneId,
        async (transaction) =>
          transaction`update hand_receipts set account_id = ${ownerTwoAccountId} where id = ${ownerOneHandReceiptId} returning id`,
      ),
    ).rejects.toThrow();
  });
});
