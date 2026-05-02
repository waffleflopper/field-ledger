import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createDrizzleDocumentRepository } from "@/modules/documents/infrastructure/drizzle-document-repository";
import { createDrizzleClient } from "@/modules/provider-boundaries/database/drizzle";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:54332/postgres";

const ownerOneId = "better-auth-document-repository-owner-one";
const ownerTwoId = "better-auth-document-repository-owner-two";
const ownerOneAccountId = "cb203d86-2b05-42c4-a4f1-96f34b9a38a5";
const ownerTwoAccountId = "4afbfd78-1046-413a-825e-5d86f6e925e1";
const ownerOneHandReceiptId = "de3d2d42-5cf8-4c0d-955f-46f81ece789a";
const ownerTwoHandReceiptId = "948d1cfd-f171-41d4-82a0-e478a94d9614";
const ownerOneDocumentId = "8c798729-b56e-484b-97bd-3b2689daf9f4";
const ownerTwoDocumentId = "14675277-bd0e-4e60-9bf3-c833230df018";
const mismatchedHandReceiptDocumentId = "71865d0d-89a7-48c9-a101-1350823acf26";

const sql = postgres(databaseUrl, { max: 1 });
const db = createDrizzleClient(databaseUrl);

describe("document repository RLS boundary", () => {
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
    await sql`delete from documents where id in (${ownerOneDocumentId}, ${ownerTwoDocumentId}, ${mismatchedHandReceiptDocumentId})`;
    await sql`delete from hand_receipts where id in (${ownerOneHandReceiptId}, ${ownerTwoHandReceiptId})`;
    await sql`delete from accounts where id in (${ownerOneAccountId}, ${ownerTwoAccountId})`;
    await sql.end();
  });

  it("lists only rows allowed by the authenticated database session", async () => {
    const repository = createDrizzleDocumentRepository(db, {
      authSubject: ownerOneId,
    });

    await expect(
      repository.listByAccountId(ownerOneAccountId),
    ).resolves.toMatchObject([
      {
        id: ownerOneDocumentId,
      },
    ]);
    await expect(
      repository.listByAccountId(ownerTwoAccountId),
    ).resolves.toEqual([]);
  });

  it("cannot create documents for another account through the repository", async () => {
    const repository = createDrizzleDocumentRepository(db, {
      authSubject: ownerOneId,
    });

    await expect(
      repository.create({
        accountId: ownerTwoAccountId,
        handReceiptId: ownerTwoHandReceiptId,
        filename: "blocked.pdf",
        mimeType: "application/pdf",
        sizeBytes: 100,
        storagePath: `${ownerTwoAccountId}/blocked`,
        uploadedAt: new Date("2026-05-02T12:00:00.000Z"),
      }),
    ).rejects.toThrow();
  });

  it("cannot create a document linked to another account's hand receipt", async () => {
    const repository = createDrizzleDocumentRepository(db, {
      authSubject: ownerOneId,
    });

    await expect(
      repository.create({
        id: mismatchedHandReceiptDocumentId,
        accountId: ownerOneAccountId,
        handReceiptId: ownerTwoHandReceiptId,
        filename: "mismatched-receipt.pdf",
        mimeType: "application/pdf",
        sizeBytes: 100,
        storagePath: `${ownerOneAccountId}/${mismatchedHandReceiptDocumentId}`,
        uploadedAt: new Date("2026-05-02T12:00:00.000Z"),
      }),
    ).rejects.toThrow();
  });
});
