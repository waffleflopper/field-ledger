import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:54332/postgres";

const ownerOneId = "39f80a20-e465-4109-b4e9-35a6e864f4f0";
const ownerTwoId = "3145b2d0-5390-49e8-83d2-2e9f9be0420a";
const ownerOneAccountId = "76231d6d-798f-43f6-b86d-9573122d1b5d";
const ownerTwoAccountId = "61f5d8e8-b640-4614-b025-0cc58f037b86";
const ownerOneEventId = "c2186404-b492-4866-8114-138d5a25f010";
const ownerTwoEventId = "4593c919-0686-4732-8563-586b98a28432";

const sql = postgres(databaseUrl, { max: 1 });

async function asAuthenticatedOwner<T>(
  ownerId: string,
  query: (transaction: postgres.TransactionSql) => Promise<T>,
) {
  return sql.begin(async (transaction) => {
    await transaction`set local role authenticated`;
    await transaction`select set_config('request.jwt.claim.sub', ${ownerId}, true)`;

    return query(transaction);
  });
}

describe("audit events RLS", () => {
  beforeAll(async () => {
    await sql`insert into accounts ${sql([
      {
        id: ownerOneAccountId,
        user_id: ownerOneId,
        access_state: "trialing",
        trial_starts_at: new Date("2026-04-29T12:00:00.000Z"),
        trial_ends_at: new Date("2026-05-29T12:00:00.000Z"),
      },
      {
        id: ownerTwoAccountId,
        user_id: ownerTwoId,
        access_state: "trialing",
        trial_starts_at: new Date("2026-04-29T12:00:00.000Z"),
        trial_ends_at: new Date("2026-05-29T12:00:00.000Z"),
      },
    ])} on conflict (user_id) do update set access_state = excluded.access_state`;

    await sql`insert into audit_events ${sql([
      {
        id: ownerOneEventId,
        account_id: ownerOneAccountId,
        actor_id: ownerOneId,
        action: "system.initialized",
        target_type: "account",
        target_id: ownerOneAccountId,
        occurred_at: new Date("2026-04-29T12:00:00.000Z"),
      },
      {
        id: ownerTwoEventId,
        account_id: ownerTwoAccountId,
        actor_id: ownerTwoId,
        action: "system.initialized",
        target_type: "account",
        target_id: ownerTwoAccountId,
        occurred_at: new Date("2026-04-29T12:00:00.000Z"),
      },
    ])} on conflict (id) do nothing`;
  });

  afterAll(async () => {
    await sql`delete from audit_events where id in (${ownerOneEventId}, ${ownerTwoEventId})`;
    await sql`delete from accounts where id in (${ownerOneAccountId}, ${ownerTwoAccountId})`;
    await sql.end();
  });

  it("allows an owner to read their own audit events", async () => {
    const rows = await asAuthenticatedOwner(
      ownerOneId,
      async (transaction) =>
        transaction`select id from audit_events where account_id = ${ownerOneAccountId}`,
    );

    expect(rows).toEqual([{ id: ownerOneEventId }]);
  });

  it("prevents an owner from reading another account's audit events", async () => {
    const rows = await asAuthenticatedOwner(
      ownerOneId,
      async (transaction) =>
        transaction`select id from audit_events where account_id = ${ownerTwoAccountId}`,
    );

    expect(rows).toEqual([]);
  });

  it("prevents an owner from inserting audit events for another account", async () => {
    await expect(
      asAuthenticatedOwner(
        ownerOneId,
        async (transaction) =>
          transaction`insert into audit_events (
            account_id,
            actor_id,
            action,
            target_type,
            target_id
          ) values (
            ${ownerTwoAccountId},
            ${ownerOneId},
            'system.initialized',
            'account',
            ${ownerTwoAccountId}
          )`,
      ),
    ).rejects.toThrow();
  });
});
