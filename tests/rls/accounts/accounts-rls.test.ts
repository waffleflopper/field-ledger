import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:54332/postgres";

const ownerOneId = "1b0c3a89-dbef-4242-8d5e-cb8d3ed728f8";
const ownerTwoId = "2b0c3a89-dbef-4242-8d5e-cb8d3ed728f8";

const sql = postgres(databaseUrl, { max: 1 });

async function asAuthenticatedOwner<T>(
  accountId: string,
  query: (transaction: postgres.TransactionSql) => Promise<T>,
) {
  return sql.begin(async (transaction) => {
    await transaction`set local role authenticated`;
    await transaction`select set_config('request.jwt.claim.sub', ${accountId}, true)`;

    return query(transaction);
  });
}

describe("accounts RLS", () => {
  beforeAll(async () => {
    await sql`insert into accounts ${sql([
      {
        id: ownerOneId,
        access_state: "trialing",
        trial_starts_at: new Date("2026-04-29T12:00:00.000Z"),
        trial_ends_at: new Date("2026-05-29T12:00:00.000Z"),
      },
      {
        id: ownerTwoId,
        access_state: "trialing",
        trial_starts_at: new Date("2026-04-29T12:00:00.000Z"),
        trial_ends_at: new Date("2026-05-29T12:00:00.000Z"),
      },
    ])} on conflict (id) do update set access_state = excluded.access_state`;
  });

  afterAll(async () => {
    await sql`delete from accounts where id in (${ownerOneId}, ${ownerTwoId})`;
    await sql.end();
  });

  it("allows an owner to read their own account record", async () => {
    const rows = await asAuthenticatedOwner(
      ownerOneId,
      async (transaction) =>
        transaction`select id from accounts where id = ${ownerOneId}`,
    );

    expect(rows).toEqual([{ id: ownerOneId }]);
  });

  it("prevents an owner from reading another account record", async () => {
    const rows = await asAuthenticatedOwner(
      ownerOneId,
      async (transaction) =>
        transaction`select id from accounts where id = ${ownerTwoId}`,
    );

    expect(rows).toEqual([]);
  });

  it("prevents an owner from updating another account record", async () => {
    const rows = await asAuthenticatedOwner(
      ownerOneId,
      async (transaction) =>
        transaction`update accounts set access_state = 'active' where id = ${ownerTwoId} returning id`,
    );

    expect(rows).toEqual([]);
  });
});
