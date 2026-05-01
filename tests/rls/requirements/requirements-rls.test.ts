import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:54332/postgres";

const ownerOneId = "better-auth-requirements-owner-one";
const ownerTwoId = "better-auth-requirements-owner-two";
const ownerOneAccountId = "0ac59a96-2ceb-45f7-8cd2-c982ff789e5c";
const ownerTwoAccountId = "f24fc639-e089-48ac-b55f-b498723a84db";
const ownerOneHandReceiptId = "8089af56-37ab-4f01-9341-6d64335ea474";
const ownerTwoHandReceiptId = "f13f5aa8-5b90-48d0-bfbc-8d7f9acf2e98";
const ownerOneItemId = "0c7f7cbb-ea86-4426-9e61-20643823c3be";
const ownerTwoItemId = "3278cae8-5608-473a-9b24-26a5fa8d7d73";
const ownerOneRequirementId = "64fca86a-8f39-4f35-89f9-8fcf48b36d03";
const ownerTwoRequirementId = "b990d595-db6d-4d4e-b97a-b9e6408ff72f";
const ownerOneInsertAllowedRequirementId =
  "8945b08f-6a2c-4a95-a022-e5208f7a9078";

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

describe("requirements RLS", () => {
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
    ])} on conflict (id) do nothing`;

    await sql`insert into items ${sql([
      {
        id: ownerOneItemId,
        account_id: ownerOneAccountId,
        hand_receipt_id: ownerOneHandReceiptId,
        nomenclature: "Owner one item",
        ecn: "REQ-ECN-ONE",
      },
      {
        id: ownerTwoItemId,
        account_id: ownerTwoAccountId,
        hand_receipt_id: ownerTwoHandReceiptId,
        nomenclature: "Owner two item",
        ecn: "REQ-ECN-TWO",
      },
    ])} on conflict (id) do nothing`;

    await sql`insert into requirements ${sql([
      {
        id: ownerOneRequirementId,
        account_id: ownerOneAccountId,
        item_id: ownerOneItemId,
        name: "Owner one check",
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
    await sql`delete from requirements where id in (${ownerOneRequirementId}, ${ownerTwoRequirementId}, ${ownerOneInsertAllowedRequirementId})`;
    await sql`delete from items where id in (${ownerOneItemId}, ${ownerTwoItemId})`;
    await sql`delete from hand_receipts where id in (${ownerOneHandReceiptId}, ${ownerTwoHandReceiptId})`;
    await sql`delete from accounts where id in (${ownerOneAccountId}, ${ownerTwoAccountId})`;
    await sql.end();
  });

  it("allows an owner to read their own requirements", async () => {
    const rows = await asAuthenticatedOwner(
      ownerOneId,
      async (transaction) =>
        transaction`select id from requirements where account_id = ${ownerOneAccountId}`,
    );

    expect(rows).toEqual([{ id: ownerOneRequirementId }]);
  });

  it("prevents an owner from reading another account's requirements", async () => {
    const rows = await asAuthenticatedOwner(
      ownerOneId,
      async (transaction) =>
        transaction`select id from requirements where account_id = ${ownerTwoAccountId}`,
    );

    expect(rows).toEqual([]);
  });

  it("allows an owner to insert requirements for their own items", async () => {
    const rows = await asAuthenticatedOwner(
      ownerOneId,
      async (transaction) =>
        transaction`insert into requirements (
          id,
          account_id,
          item_id,
          name,
          interval_type,
          next_due_date
        ) values (
          ${ownerOneInsertAllowedRequirementId},
          ${ownerOneAccountId},
          ${ownerOneItemId},
          'Allowed requirement',
          'annual',
          '2027-01-01'
        ) returning id, account_id, item_id`,
    );

    expect(rows).toEqual([
      {
        id: ownerOneInsertAllowedRequirementId,
        account_id: ownerOneAccountId,
        item_id: ownerOneItemId,
      },
    ]);
  });

  it("prevents an owner from inserting requirements for another account", async () => {
    await expect(
      asAuthenticatedOwner(
        ownerOneId,
        async (transaction) =>
          transaction`insert into requirements (
            account_id,
            item_id,
            name,
            interval_type,
            next_due_date
          ) values (
            ${ownerTwoAccountId},
            ${ownerTwoItemId},
            'Blocked requirement',
            'annual',
            '2027-01-01'
          )`,
      ),
    ).rejects.toThrow();
  });

  it("prevents an owner from linking a requirement to another account's item", async () => {
    await expect(
      asAuthenticatedOwner(
        ownerOneId,
        async (transaction) =>
          transaction`insert into requirements (
            account_id,
            item_id,
            name,
            interval_type,
            next_due_date
          ) values (
            ${ownerOneAccountId},
            ${ownerTwoItemId},
            'Cross item requirement',
            'annual',
            '2027-01-01'
          )`,
      ),
    ).rejects.toThrow();
  });
});
