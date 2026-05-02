import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:54332/postgres";

const ownerOneId = "better-auth-requirement-completions-owner-one";
const ownerTwoId = "better-auth-requirement-completions-owner-two";
const ownerOneAccountId = "8cc55e87-bd5e-4e04-afba-12b68513cadd";
const ownerTwoAccountId = "454658d4-2109-466e-a786-fb09ce982081";
const ownerOneHandReceiptId = "564e7f44-50f2-4287-8d3e-cdcae1b85a64";
const ownerTwoHandReceiptId = "f7d004c0-7f23-4ed9-bb47-28fca60397a8";
const ownerOneItemId = "48ef1c09-a4e4-47a1-8cb0-39e3a8754ac2";
const ownerTwoItemId = "45998d85-6314-4c0f-899b-d0b818e1fc76";
const ownerOneRequirementId = "c35c4af0-8a7f-42bb-a793-80cb505f03f1";
const ownerTwoRequirementId = "1f0ee11f-d342-43c2-aac9-cd6941bba8fa";
const ownerOneCompletionId = "3a370ca9-d4b9-4b07-8537-a8d71f0f05a3";
const ownerTwoCompletionId = "5b790a96-5554-4d9c-966f-faf734b85ad2";
const ownerOneInsertAllowedCompletionId =
  "1ad3aca7-5792-45f5-bf5b-24ab9e963490";

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

describe("requirement completions RLS", () => {
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
        ecn: "REQ-COMP-ONE",
      },
      {
        id: ownerTwoItemId,
        account_id: ownerTwoAccountId,
        hand_receipt_id: ownerTwoHandReceiptId,
        nomenclature: "Owner two item",
        ecn: "REQ-COMP-TWO",
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

    await sql`insert into requirement_completions ${sql([
      {
        id: ownerOneCompletionId,
        account_id: ownerOneAccountId,
        requirement_id: ownerOneRequirementId,
        completed_on: "2026-05-01",
        notes: "Owner one completion",
      },
      {
        id: ownerTwoCompletionId,
        account_id: ownerTwoAccountId,
        requirement_id: ownerTwoRequirementId,
        completed_on: "2026-05-01",
        notes: "Owner two completion",
      },
    ])} on conflict (id) do nothing`;
  });

  afterAll(async () => {
    await sql`delete from requirement_completions where id in (${ownerOneCompletionId}, ${ownerTwoCompletionId}, ${ownerOneInsertAllowedCompletionId})`;
    await sql`delete from requirements where id in (${ownerOneRequirementId}, ${ownerTwoRequirementId})`;
    await sql`delete from items where id in (${ownerOneItemId}, ${ownerTwoItemId})`;
    await sql`delete from hand_receipts where id in (${ownerOneHandReceiptId}, ${ownerTwoHandReceiptId})`;
    await sql`delete from accounts where id in (${ownerOneAccountId}, ${ownerTwoAccountId})`;
    await sql.end();
  });

  it("allows an owner to read their own completion history", async () => {
    const rows = await asAuthenticatedOwner(
      ownerOneId,
      async (transaction) =>
        transaction`select id from requirement_completions where account_id = ${ownerOneAccountId}`,
    );

    expect(rows).toEqual([{ id: ownerOneCompletionId }]);
  });

  it("prevents an owner from reading another account's completion history", async () => {
    const rows = await asAuthenticatedOwner(
      ownerOneId,
      async (transaction) =>
        transaction`select id from requirement_completions where account_id = ${ownerTwoAccountId}`,
    );

    expect(rows).toEqual([]);
  });

  it("allows an owner to insert completion history for their own requirement", async () => {
    const rows = await asAuthenticatedOwner(
      ownerOneId,
      async (transaction) =>
        transaction`insert into requirement_completions (
          id,
          account_id,
          requirement_id,
          completed_on,
          notes
        ) values (
          ${ownerOneInsertAllowedCompletionId},
          ${ownerOneAccountId},
          ${ownerOneRequirementId},
          '2026-05-02',
          'Allowed completion'
        ) returning id, account_id, requirement_id`,
    );

    expect(rows).toEqual([
      {
        id: ownerOneInsertAllowedCompletionId,
        account_id: ownerOneAccountId,
        requirement_id: ownerOneRequirementId,
      },
    ]);
  });

  it("prevents an owner from inserting completion history for another account", async () => {
    await expect(
      asAuthenticatedOwner(
        ownerOneId,
        async (transaction) =>
          transaction`insert into requirement_completions (
            account_id,
            requirement_id,
            completed_on
          ) values (
            ${ownerTwoAccountId},
            ${ownerTwoRequirementId},
            '2026-05-02'
          )`,
      ),
    ).rejects.toThrow();
  });

  it("prevents an owner from linking completion history to another account's requirement", async () => {
    await expect(
      asAuthenticatedOwner(
        ownerOneId,
        async (transaction) =>
          transaction`insert into requirement_completions (
            account_id,
            requirement_id,
            completed_on
          ) values (
            ${ownerOneAccountId},
            ${ownerTwoRequirementId},
            '2026-05-02'
          )`,
      ),
    ).rejects.toThrow();
  });
});
