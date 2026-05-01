import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createDrizzleClient } from "@/modules/provider-boundaries/database/drizzle";
import { createDrizzleRequirementCompletionRepository } from "@/modules/requirements/infrastructure/drizzle-requirement-completion-repository";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:54332/postgres";

const ownerOneId = "better-auth-requirement-completion-repo-owner-one";
const ownerTwoId = "better-auth-requirement-completion-repo-owner-two";
const ownerOneAccountId = "0bda01b9-6a53-4c0e-bfc8-c85cd076810f";
const ownerTwoAccountId = "0d632d53-639a-4af9-8d89-e95a00c8e3a0";
const ownerOneHandReceiptId = "5508e453-9f3f-4da1-8e05-6871c939487f";
const ownerTwoHandReceiptId = "8379b014-105c-46dd-b323-25ca3ccffea3";
const ownerOneItemId = "045d8681-dfd3-4dd8-b0e1-4d98da3338bf";
const ownerTwoItemId = "86bb56d9-95ef-4773-a4bf-ffed48fa89f0";
const ownerOneRequirementId = "51c41064-2d4c-4541-8279-ded174164c2d";
const ownerTwoRequirementId = "f871a592-d4f9-4f80-9df6-3bb6ab03f11a";
const ownerTwoCompletionId = "9e9d8644-d894-4712-a5ec-28db95f87e90";

const sql = postgres(databaseUrl, { max: 1 });
const db = createDrizzleClient(databaseUrl);

describe("requirement completion repository RLS boundary", () => {
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
        ecn: "REQ-COMP-REPO-ONE",
      },
      {
        id: ownerTwoItemId,
        account_id: ownerTwoAccountId,
        hand_receipt_id: ownerTwoHandReceiptId,
        nomenclature: "Owner two item",
        ecn: "REQ-COMP-REPO-TWO",
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
        id: ownerTwoCompletionId,
        account_id: ownerTwoAccountId,
        requirement_id: ownerTwoRequirementId,
        completed_on: "2026-05-01",
      },
    ])} on conflict (id) do nothing`;
  });

  afterAll(async () => {
    await sql`delete from requirement_completions where account_id in (${ownerOneAccountId}, ${ownerTwoAccountId})`;
    await sql`delete from requirements where id in (${ownerOneRequirementId}, ${ownerTwoRequirementId})`;
    await sql`delete from items where id in (${ownerOneItemId}, ${ownerTwoItemId})`;
    await sql`delete from hand_receipts where id in (${ownerOneHandReceiptId}, ${ownerTwoHandReceiptId})`;
    await sql`delete from accounts where id in (${ownerOneAccountId}, ${ownerTwoAccountId})`;
    await sql.end();
  });

  it("creates and reads only completions allowed by the authenticated session", async () => {
    const repository = createDrizzleRequirementCompletionRepository(db, {
      authSubject: ownerOneId,
    });

    const created = await repository.create({
      accountId: ownerOneAccountId,
      requirementId: ownerOneRequirementId,
      completedOn: "2026-05-01",
      notes: "Owner one completion",
    });

    await expect(
      repository.listByRequirementId(ownerOneAccountId, ownerOneRequirementId),
    ).resolves.toMatchObject([{ id: created.id }]);
    await expect(
      repository.listByRequirementId(ownerTwoAccountId, ownerTwoRequirementId),
    ).resolves.toEqual([]);
  });

  it("cannot create completion history for another account through the repository", async () => {
    const repository = createDrizzleRequirementCompletionRepository(db, {
      authSubject: ownerOneId,
    });

    await expect(
      repository.create({
        accountId: ownerTwoAccountId,
        requirementId: ownerTwoRequirementId,
        completedOn: "2026-05-01",
        notes: null,
      }),
    ).rejects.toThrow();
  });
});
