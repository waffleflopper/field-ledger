import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:54332/postgres";

const ownerOneId = "better-auth-locations-owner-one";
const ownerTwoId = "better-auth-locations-owner-two";
const ownerOneAccountId = "30cb269f-0f50-40a0-993a-cc494fa8fcb2";
const ownerTwoAccountId = "298dc5fc-2f26-42bc-b4a4-cdbf5d572e83";
const ownerOneLocationId = "0e7a3923-c6a3-4c02-ab7e-cc932e47f0af";
const ownerTwoLocationId = "6cad59ab-cb57-40bb-89da-d45aef9bb399";
const ownerOneInsertAllowedLocationId = "bc990747-9359-4eef-a00b-8b13ef91c162";

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

describe("locations RLS", () => {
  beforeAll(async () => {
    await sql`insert into accounts ${sql([
      {
        id: ownerOneAccountId,
        auth_user_id: ownerOneId,
        access_state: "trialing",
        trial_starts_at: new Date("2026-04-30T12:00:00.000Z"),
        trial_ends_at: new Date("2100-01-01T00:00:00.000Z"),
      },
      {
        id: ownerTwoAccountId,
        auth_user_id: ownerTwoId,
        access_state: "trialing",
        trial_starts_at: new Date("2026-04-30T12:00:00.000Z"),
        trial_ends_at: new Date("2100-01-01T00:00:00.000Z"),
      },
    ])} on conflict (auth_user_id) do update set access_state = excluded.access_state`;

    await sql`insert into locations ${sql([
      {
        id: ownerOneLocationId,
        account_id: ownerOneAccountId,
        name: "Owner one location",
      },
      {
        id: ownerTwoLocationId,
        account_id: ownerTwoAccountId,
        name: "Owner two location",
      },
    ])} on conflict (id) do nothing`;
  });

  afterAll(async () => {
    await sql`delete from locations where id in (${ownerOneLocationId}, ${ownerTwoLocationId}, ${ownerOneInsertAllowedLocationId})`;
    await sql`delete from accounts where id in (${ownerOneAccountId}, ${ownerTwoAccountId})`;
    await sql.end();
  });

  it("allows an owner to read their own locations", async () => {
    const rows = await asAuthenticatedOwner(
      ownerOneId,
      async (transaction) =>
        transaction`select id from locations where account_id = ${ownerOneAccountId}`,
    );

    expect(rows).toEqual([{ id: ownerOneLocationId }]);
  });

  it("prevents an owner from reading another account's locations", async () => {
    const rows = await asAuthenticatedOwner(
      ownerOneId,
      async (transaction) =>
        transaction`select id from locations where account_id = ${ownerTwoAccountId}`,
    );

    expect(rows).toEqual([]);
  });

  it("allows an owner to insert locations for their own account", async () => {
    const rows = await asAuthenticatedOwner(
      ownerOneId,
      async (transaction) =>
        transaction`insert into locations (
            id,
            account_id,
            name
          ) values (
            ${ownerOneInsertAllowedLocationId},
            ${ownerOneAccountId},
            'Allowed location'
          ) returning id, account_id, name`,
    );

    expect(rows).toEqual([
      {
        id: ownerOneInsertAllowedLocationId,
        account_id: ownerOneAccountId,
        name: "Allowed location",
      },
    ]);
  });

  it("prevents an owner from inserting locations for another account", async () => {
    await expect(
      asAuthenticatedOwner(
        ownerOneId,
        async (transaction) =>
          transaction`insert into locations (
            account_id,
            name
          ) values (
            ${ownerTwoAccountId},
            'Blocked location'
          )`,
      ),
    ).rejects.toThrow();
  });

  it("prevents an owner from moving a location to another account", async () => {
    await expect(
      asAuthenticatedOwner(
        ownerOneId,
        async (transaction) =>
          transaction`update locations set account_id = ${ownerTwoAccountId} where id = ${ownerOneLocationId} returning id`,
      ),
    ).rejects.toThrow();
  });
});
