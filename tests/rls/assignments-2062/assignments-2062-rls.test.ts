import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:54332/postgres";

const ownerOneId = "better-auth-assignment-owner-one";
const ownerTwoId = "better-auth-assignment-owner-two";
const ownerOneAccountId = "52cc4b16-96e8-49c2-ae21-b00dc36d9b0c";
const ownerTwoAccountId = "8bc2df20-b293-4f29-a2b0-f98cb43abf3c";
const ownerOneHandReceiptId = "f7b1d8ea-3063-4ed4-b0df-f197db9e54d6";
const ownerTwoHandReceiptId = "3d63f1fd-8dd1-48d5-bd2c-7ace6c5f496e";
const ownerOneContactId = "853f65af-1d2a-41c4-bda9-ae18d80da2ea";
const ownerTwoContactId = "be747d2b-efeb-421a-b900-921221af35bb";
const ownerOneDocumentId = "e4213e16-1b5f-4766-b862-c12f73ece108";
const ownerTwoDocumentId = "d6253640-571e-44dd-a8bd-427bc613c248";
const ownerOneItemId = "11f908e4-00f5-49b4-b6e8-e6ce70887e0c";
const ownerTwoItemId = "f8a5c59e-9010-4d41-b45d-4c3d4c7739f5";
const ownerOneInsertItemId = "5822f237-ec62-430c-bb37-e5984f0f419d";
const ownerOneAssignmentId = "622270dd-9c77-4f83-8da0-7183b118412f";
const ownerTwoAssignmentId = "271c82d4-b3bc-4f82-af72-f15f614b1a9b";
const ownerOneLinkId = "092b4804-6c02-4968-a78a-4667a298e37c";
const ownerTwoLinkId = "8310d384-4e92-4e12-ac71-e25353fa36b5";
const ownerOneInsertAssignmentId = "15d0422a-9912-45cf-927e-6a49df7a7105";
const ownerOneInsertLinkId = "5f483d29-f0c3-4867-bd2e-47b67e16fb5b";
const ownerTwoBlockedLinkId = "1c5e5430-2e21-45b2-bbd9-b58113b7c4b8";
const ownerOneConstraintItemId = "e048fd65-5df6-4cc9-b71a-5041668284f5";
const ownerOneConstraintAssignmentId = "40c90c2c-adf5-4d4e-9b20-6326b0c0f045";
const ownerOneConstraintLinkId = "fc60cfcf-ad17-4b6e-b835-b6532dd03d7f";

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

describe("assignments-2062 RLS", () => {
  beforeAll(async () => {
    await sql`insert into accounts ${sql([
      {
        id: ownerOneAccountId,
        auth_user_id: ownerOneId,
        access_state: "trialing",
        trial_starts_at: new Date("2026-05-02T12:00:00.000Z"),
        trial_ends_at: new Date("2026-06-02T12:00:00.000Z"),
      },
      {
        id: ownerTwoAccountId,
        auth_user_id: ownerTwoId,
        access_state: "trialing",
        trial_starts_at: new Date("2026-05-02T12:00:00.000Z"),
        trial_ends_at: new Date("2026-06-02T12:00:00.000Z"),
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

    await sql`insert into items ${sql([
      {
        id: ownerOneItemId,
        account_id: ownerOneAccountId,
        hand_receipt_id: ownerOneHandReceiptId,
        nomenclature: "Owner one item",
        ecn: "RLS-2062-1",
      },
      {
        id: ownerTwoItemId,
        account_id: ownerTwoAccountId,
        hand_receipt_id: ownerTwoHandReceiptId,
        nomenclature: "Owner two item",
        ecn: "RLS-2062-2",
      },
      {
        id: ownerOneInsertItemId,
        account_id: ownerOneAccountId,
        hand_receipt_id: ownerOneHandReceiptId,
        nomenclature: "Owner one insert item",
        ecn: "RLS-2062-3",
      },
    ])} on conflict (id) do nothing`;

    await sql`insert into assignments ${sql([
      {
        id: ownerOneAssignmentId,
        account_id: ownerOneAccountId,
        hand_receipt_id: ownerOneHandReceiptId,
        contact_id: ownerOneContactId,
        document_id: ownerOneDocumentId,
      },
      {
        id: ownerTwoAssignmentId,
        account_id: ownerTwoAccountId,
        hand_receipt_id: ownerTwoHandReceiptId,
        contact_id: ownerTwoContactId,
        document_id: ownerTwoDocumentId,
      },
    ])} on conflict (id) do nothing`;

    await sql`insert into assignment_item_links ${sql([
      {
        id: ownerOneLinkId,
        account_id: ownerOneAccountId,
        assignment_id: ownerOneAssignmentId,
        item_id: ownerOneItemId,
      },
      {
        id: ownerTwoLinkId,
        account_id: ownerTwoAccountId,
        assignment_id: ownerTwoAssignmentId,
        item_id: ownerTwoItemId,
      },
    ])} on conflict (id) do nothing`;
  });

  afterAll(async () => {
    await sql`delete from assignment_item_links where id in (${ownerOneLinkId}, ${ownerTwoLinkId}, ${ownerOneInsertLinkId}, ${ownerOneConstraintLinkId})`;
    await sql`delete from assignments where id in (${ownerOneAssignmentId}, ${ownerTwoAssignmentId}, ${ownerOneInsertAssignmentId}, ${ownerOneConstraintAssignmentId})`;
    await sql`delete from items where id in (${ownerOneItemId}, ${ownerTwoItemId}, ${ownerOneInsertItemId}, ${ownerOneConstraintItemId})`;
    await sql`delete from documents where id in (${ownerOneDocumentId}, ${ownerTwoDocumentId})`;
    await sql`delete from contacts where id in (${ownerOneContactId}, ${ownerTwoContactId})`;
    await sql`delete from hand_receipts where id in (${ownerOneHandReceiptId}, ${ownerTwoHandReceiptId})`;
    await sql`delete from accounts where id in (${ownerOneAccountId}, ${ownerTwoAccountId})`;
    await sql.end();
  });

  it("prevents an owner from reading another account's assignments and links", async () => {
    const assignments = await asAuthenticatedOwner(
      ownerOneId,
      async (transaction) =>
        transaction`select id from assignments where account_id = ${ownerTwoAccountId}`,
    );
    const links = await asAuthenticatedOwner(
      ownerOneId,
      async (transaction) =>
        transaction`select id from assignment_item_links where account_id = ${ownerTwoAccountId}`,
    );

    expect(assignments).toEqual([]);
    expect(links).toEqual([]);
  });

  it("allows an owner to insert their own assignment and item link", async () => {
    await asAuthenticatedOwner(
      ownerOneId,
      async (transaction) =>
        transaction`insert into assignments (
          id,
          account_id,
          hand_receipt_id,
          contact_id,
          document_id
        ) values (
          ${ownerOneInsertAssignmentId},
          ${ownerOneAccountId},
          ${ownerOneHandReceiptId},
          ${ownerOneContactId},
          ${ownerOneDocumentId}
        )`,
    );

    await asAuthenticatedOwner(
      ownerOneId,
      async (transaction) =>
        transaction`insert into assignment_item_links (
          id,
          account_id,
          assignment_id,
          item_id
        ) values (
          ${ownerOneInsertLinkId},
          ${ownerOneAccountId},
          ${ownerOneInsertAssignmentId},
          ${ownerOneInsertItemId}
        )`,
    );
  });

  it("prevents an owner from inserting assignment rows for another account", async () => {
    await expect(
      asAuthenticatedOwner(
        ownerOneId,
        async (transaction) =>
          transaction`insert into assignments (
            account_id,
            hand_receipt_id,
            contact_id,
            document_id
          ) values (
            ${ownerTwoAccountId},
            ${ownerTwoHandReceiptId},
            ${ownerTwoContactId},
            ${ownerTwoDocumentId}
          )`,
      ),
    ).rejects.toThrow();
  });

  it("prevents an owner from inserting item links for another account", async () => {
    await expect(
      asAuthenticatedOwner(
        ownerOneId,
        async (transaction) =>
          transaction`insert into assignment_item_links (
            id,
            account_id,
            assignment_id,
            item_id
          ) values (
            ${ownerTwoBlockedLinkId},
            ${ownerTwoAccountId},
            ${ownerTwoAssignmentId},
            ${ownerTwoItemId}
          )`,
      ),
    ).rejects.toThrow();
  });

  it("prevents an owner from updating another account's assignments and links", async () => {
    const assignmentRows = await asAuthenticatedOwner(
      ownerOneId,
      async (transaction) =>
        transaction`update assignments set status = 'closed' where id = ${ownerTwoAssignmentId} returning id`,
    );
    const linkRows = await asAuthenticatedOwner(
      ownerOneId,
      async (transaction) =>
        transaction`update assignment_item_links set status = 'closed' where id = ${ownerTwoLinkId} returning id`,
    );

    expect(assignmentRows).toEqual([]);
    expect(linkRows).toEqual([]);

    const [assignment] =
      await sql`select status from assignments where id = ${ownerTwoAssignmentId}`;
    const [link] =
      await sql`select status from assignment_item_links where id = ${ownerTwoLinkId}`;

    expect(assignment?.status).toBe("active");
    expect(link?.status).toBe("active");
  });

  it("prevents assignment item links from storing inconsistent closed state", async () => {
    await sql`insert into items (
      id,
      account_id,
      hand_receipt_id,
      nomenclature,
      ecn
    ) values (
      ${ownerOneConstraintItemId},
      ${ownerOneAccountId},
      ${ownerOneHandReceiptId},
      'Owner one constraint item',
      'RLS-2062-CONSTRAINT'
    ) on conflict (id) do nothing`;
    await sql`insert into assignments (
      id,
      account_id,
      hand_receipt_id,
      contact_id,
      document_id
    ) values (
      ${ownerOneConstraintAssignmentId},
      ${ownerOneAccountId},
      ${ownerOneHandReceiptId},
      ${ownerOneContactId},
      ${ownerOneDocumentId}
    ) on conflict (id) do nothing`;
    await sql`insert into assignment_item_links (
      id,
      account_id,
      assignment_id,
      item_id
    ) values (
      ${ownerOneConstraintLinkId},
      ${ownerOneAccountId},
      ${ownerOneConstraintAssignmentId},
      ${ownerOneConstraintItemId}
    ) on conflict (id) do nothing`;

    const visibleRows = await asAuthenticatedOwner(
      ownerOneId,
      async (transaction) =>
        transaction`select id from assignment_item_links where id = ${ownerOneConstraintLinkId}`,
    );

    expect(visibleRows).toEqual([{ id: ownerOneConstraintLinkId }]);

    await expect(
      asAuthenticatedOwner(
        ownerOneId,
        async (transaction) =>
          transaction`update assignment_item_links set closed_at = now() where id = ${ownerOneConstraintLinkId}`,
      ),
    ).rejects.toThrow();
  });
});
