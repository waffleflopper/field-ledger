import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:54332/postgres";

const ownerOneId = "better-auth-owner-one";
const ownerTwoId = "better-auth-owner-two";
const ownerOneAccountId = "de1415fb-dbd2-4527-8cd1-6b2c0175ca8a";
const ownerTwoAccountId = "4919295f-e59b-49f9-8335-b7b51558e0b7";

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

describe("accounts RLS", () => {
  beforeAll(async () => {
    await sql`insert into accounts ${sql([
      {
        id: ownerOneAccountId,
        auth_user_id: ownerOneId,
        access_state: "trialing",
        trial_starts_at: new Date("2026-04-29T12:00:00.000Z"),
        trial_ends_at: new Date("2026-05-29T12:00:00.000Z"),
      },
      {
        id: ownerTwoAccountId,
        auth_user_id: ownerTwoId,
        access_state: "trialing",
        trial_starts_at: new Date("2026-04-29T12:00:00.000Z"),
        trial_ends_at: new Date("2026-05-29T12:00:00.000Z"),
      },
    ])} on conflict (auth_user_id) do update set access_state = excluded.access_state`;
  });

  afterAll(async () => {
    await sql`delete from accounts where id in (${ownerOneAccountId}, ${ownerTwoAccountId})`;
    await sql.end();
  });

  it("allows an owner to read their own account record", async () => {
    const rows = await asAuthenticatedOwner(
      ownerOneId,
      async (transaction) =>
        transaction`select id from accounts where auth_user_id = ${ownerOneId}`,
    );

    expect(rows).toEqual([{ id: ownerOneAccountId }]);
  });

  it("prevents an owner from reading another account record", async () => {
    const rows = await asAuthenticatedOwner(
      ownerOneId,
      async (transaction) =>
        transaction`select id from accounts where auth_user_id = ${ownerTwoId}`,
    );

    expect(rows).toEqual([]);
  });

  it("prevents an owner from updating another account record", async () => {
    const rows = await asAuthenticatedOwner(
      ownerOneId,
      async (transaction) =>
        transaction`update accounts set access_state = 'active' where auth_user_id = ${ownerTwoId} returning id`,
    );

    expect(rows).toEqual([]);
  });
});
