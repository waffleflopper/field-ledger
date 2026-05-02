import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:54332/postgres";

const ownerOneId = "better-auth-documents-owner-one";
const ownerTwoId = "better-auth-documents-owner-two";
const ownerOneAccountId = "9d272f75-7642-46ba-91cd-a26a8ae4277f";
const ownerTwoAccountId = "52de8870-03f0-4f47-948a-2fa3cd5dfcf0";
const ownerOneHandReceiptId = "63926adf-33a5-482c-8dd7-a8748bfeb957";
const ownerTwoHandReceiptId = "2579d0ac-9085-4d9c-b975-336bd550d490";
const ownerOneDocumentId = "b3f7d90a-7b7a-4f90-9e7a-b05fe5470599";
const ownerTwoDocumentId = "fca2646a-8ac8-48c6-a06b-8e1f8f9236ca";
const ownerOneInsertAllowedDocumentId = "94e067e4-c154-4a66-aa61-dd2f8dcb3568";

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

describe("documents RLS", () => {
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

    await sql`insert into documents ${sql([
      {
        id: ownerOneDocumentId,
        account_id: ownerOneAccountId,
        hand_receipt_id: ownerOneHandReceiptId,
        filename: "owner-one.pdf",
        mime_type: "application/pdf",
        size_bytes: 100,
        storage_path: `${ownerOneAccountId}/${ownerOneDocumentId}`,
      },
      {
        id: ownerTwoDocumentId,
        account_id: ownerTwoAccountId,
        hand_receipt_id: ownerTwoHandReceiptId,
        filename: "owner-two.pdf",
        mime_type: "application/pdf",
        size_bytes: 100,
        storage_path: `${ownerTwoAccountId}/${ownerTwoDocumentId}`,
      },
    ])} on conflict (id) do nothing`;
  });

  afterAll(async () => {
    await sql`delete from documents where id in (${ownerOneDocumentId}, ${ownerTwoDocumentId}, ${ownerOneInsertAllowedDocumentId})`;
    await sql`delete from hand_receipts where id in (${ownerOneHandReceiptId}, ${ownerTwoHandReceiptId})`;
    await sql`delete from accounts where id in (${ownerOneAccountId}, ${ownerTwoAccountId})`;
    await sql.end();
  });

  it("allows an owner to read their own documents", async () => {
    const rows = await asAuthenticatedOwner(
      ownerOneId,
      async (transaction) =>
        transaction`select id from documents where account_id = ${ownerOneAccountId}`,
    );

    expect(rows).toEqual([{ id: ownerOneDocumentId }]);
  });

  it("prevents an owner from reading another account's documents", async () => {
    const rows = await asAuthenticatedOwner(
      ownerOneId,
      async (transaction) =>
        transaction`select id from documents where account_id = ${ownerTwoAccountId}`,
    );

    expect(rows).toEqual([]);
  });

  it("allows an owner to insert documents for their own account", async () => {
    await expect(
      asAuthenticatedOwner(
        ownerOneId,
        async (transaction) =>
          transaction`insert into documents (
            id,
            account_id,
            hand_receipt_id,
            filename,
            mime_type,
            size_bytes,
            storage_path
          ) values (
            ${ownerOneInsertAllowedDocumentId},
            ${ownerOneAccountId},
            ${ownerOneHandReceiptId},
            'allowed.pdf',
            'application/pdf',
            100,
            ${`${ownerOneAccountId}/${ownerOneInsertAllowedDocumentId}`}
          )`,
      ),
    ).resolves.not.toThrow();
  });

  it("prevents an owner from inserting documents for another account", async () => {
    await expect(
      asAuthenticatedOwner(
        ownerOneId,
        async (transaction) =>
          transaction`insert into documents (
            account_id,
            hand_receipt_id,
            filename,
            mime_type,
            size_bytes,
            storage_path
          ) values (
            ${ownerTwoAccountId},
            ${ownerTwoHandReceiptId},
            'blocked.pdf',
            'application/pdf',
            100,
            ${`${ownerTwoAccountId}/blocked`}
          )`,
      ),
    ).rejects.toThrow();
  });
});
