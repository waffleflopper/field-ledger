import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createDrizzleAuditRepository } from "@/modules/audit/infrastructure/drizzle-audit-repository";
import { createDrizzleClient } from "@/modules/provider-boundaries/database/drizzle";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:54332/postgres";

const ownerOneId = "better-auth-repository-owner-one";
const ownerTwoId = "better-auth-repository-owner-two";
const ownerOneAccountId = "066b564f-e675-40bf-85bd-d83e0df520e5";
const ownerTwoAccountId = "fe8d681c-d75b-4c35-929b-b1ba8f3a90ac";
const ownerOneEventId = "e40f972a-1ff4-47f2-9087-d85e08368022";
const ownerTwoEventId = "10a940e6-a038-4c8a-a1de-66638a6efa6a";

const sql = postgres(databaseUrl, { max: 1 });
const db = createDrizzleClient(databaseUrl);

describe("audit repository RLS boundary", () => {
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

  it("lists only rows allowed by the authenticated database session", async () => {
    const repository = createDrizzleAuditRepository(db, {
      authSubject: ownerOneId,
    });

    await expect(
      repository.listByAccountId(ownerOneAccountId),
    ).resolves.toMatchObject([
      {
        id: ownerOneEventId,
      },
    ]);

    await expect(
      repository.listByAccountId(ownerTwoAccountId),
    ).resolves.toEqual([]);
  });

  it("cannot record events for another account through the repository", async () => {
    const repository = createDrizzleAuditRepository(db, {
      authSubject: ownerOneId,
    });

    await expect(
      repository.record({
        accountId: ownerTwoAccountId,
        actorId: ownerOneId,
        action: "system.initialized",
        targetType: "account",
        targetId: ownerTwoAccountId,
        occurredAt: new Date("2026-04-29T14:00:00.000Z"),
        metadata: null,
      }),
    ).rejects.toThrow();
  });
});
