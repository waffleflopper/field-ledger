import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:54332/postgres";

const ownerOneId = "better-auth-contacts-owner-one";
const ownerTwoId = "better-auth-contacts-owner-two";
const ownerOneAccountId = "c9d55730-cb49-4f2d-b0eb-3027335ef7f1";
const ownerTwoAccountId = "2b2d8b9b-76ee-4cb6-a17a-49468dc7e566";
const ownerOneContactId = "968f2cf1-1d9c-43e2-9c13-85ec6af87919";
const ownerTwoContactId = "39288894-9415-4195-9032-c1b1c62f66d7";
const ownerOneInsertAllowedContactId = "f458112e-6092-4f90-8044-5252e610f8e9";

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

describe("contacts RLS", () => {
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

    await sql`insert into contacts ${sql([
      {
        id: ownerOneContactId,
        account_id: ownerOneAccountId,
        display_name: "Owner one contact",
      },
      {
        id: ownerTwoContactId,
        account_id: ownerTwoAccountId,
        display_name: "Owner two contact",
      },
    ])} on conflict (id) do nothing`;
  });

  afterAll(async () => {
    await sql`delete from contacts where id in (${ownerOneContactId}, ${ownerTwoContactId}, ${ownerOneInsertAllowedContactId})`;
    await sql`delete from accounts where id in (${ownerOneAccountId}, ${ownerTwoAccountId})`;
    await sql.end();
  });

  it("allows an owner to read their own contacts", async () => {
    const rows = await asAuthenticatedOwner(
      ownerOneId,
      async (transaction) =>
        transaction`select id from contacts where account_id = ${ownerOneAccountId}`,
    );

    expect(rows).toEqual([{ id: ownerOneContactId }]);
  });

  it("prevents an owner from reading another account's contacts", async () => {
    const rows = await asAuthenticatedOwner(
      ownerOneId,
      async (transaction) =>
        transaction`select id from contacts where account_id = ${ownerTwoAccountId}`,
    );

    expect(rows).toEqual([]);
  });

  it("allows an owner to insert contacts for their own account", async () => {
    await expect(
      asAuthenticatedOwner(
        ownerOneId,
        async (transaction) =>
          transaction`insert into contacts (
            id,
            account_id,
            display_name
          ) values (
            ${ownerOneInsertAllowedContactId},
            ${ownerOneAccountId},
            'Allowed contact'
          )`,
      ),
    ).resolves.not.toThrow();
  });

  it("prevents an owner from inserting contacts for another account", async () => {
    await expect(
      asAuthenticatedOwner(
        ownerOneId,
        async (transaction) =>
          transaction`insert into contacts (
            account_id,
            display_name
          ) values (
            ${ownerTwoAccountId},
            'Blocked contact'
          )`,
      ),
    ).rejects.toThrow();
  });

  it("prevents an owner from moving a contact to another account", async () => {
    await expect(
      asAuthenticatedOwner(
        ownerOneId,
        async (transaction) =>
          transaction`update contacts set account_id = ${ownerTwoAccountId} where id = ${ownerOneContactId} returning id`,
      ),
    ).rejects.toThrow();
  });
});
