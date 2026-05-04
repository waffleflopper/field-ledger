import { describe, expect, it } from "vitest";

import type { AccountRecord } from "@/modules/accounts/application/ensure-account";
import { appRouter } from "@/server/trpc/router";
import { InMemoryAccountRepository } from "../../support/account-repository";
import { InMemoryAssignmentItemLinkRepository } from "../../support/assignment-item-link-repository";
import { InMemoryAssignmentRepository } from "../../support/assignment-repository";
import { InMemoryAuditRepository } from "../../support/audit-repository";
import { createInMemoryAppUnitOfWork } from "../../support/app-unit-of-work";
import { InMemoryContactRepository } from "../../support/contact-repository";
import { InMemoryDocumentRepository } from "../../support/document-repository";
import { InMemoryHandReceiptRepository } from "../../support/hand-receipt-repository";
import { InMemoryItemRepository } from "../../support/item-repository";
import { createEmptyLocationRepository } from "../../support/location-repository";
import { createEmptyRequirementRepository } from "../../support/requirement-repository";

const now = new Date("2026-05-02T12:00:00.000Z");

function createAccount(overrides: Partial<AccountRecord> = {}): AccountRecord {
  return {
    id: "account-1",
    userId: "owner-1",
    accessState: "active",
    subscriptionTier: "base",
    trialStartsAt: new Date("2026-04-01T12:00:00.000Z"),
    trialEndsAt: new Date("2100-01-01T00:00:00.000Z"),
    onboardingCompletedAt: null,
    ...overrides,
  };
}

function createCaller(account = createAccount()) {
  const accountRepository = new InMemoryAccountRepository([account]);
  const assignmentRepository = new InMemoryAssignmentRepository();
  const assignmentItemLinkRepository =
    new InMemoryAssignmentItemLinkRepository();
  const auditRepository = new InMemoryAuditRepository();
  const contactRepository = new InMemoryContactRepository([
    {
      id: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
      accountId: account.id,
      displayName: "SPC Rivera",
      createdAt: now,
      updatedAt: now,
    },
  ]);
  const documentRepository = new InMemoryDocumentRepository([
    {
      id: "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb",
      accountId: account.id,
      handReceiptId: "88888888-8888-4888-8888-888888888888",
      filename: "signed-2062.pdf",
      mimeType: "application/pdf",
      sizeBytes: 100,
      storagePath: `${account.id}/bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb`,
      uploadedAt: now,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      accountId: account.id,
      handReceiptId: "55555555-5555-4555-8555-555555555555",
      filename: "archived-2062.pdf",
      mimeType: "application/pdf",
      sizeBytes: 100,
      storagePath: `${account.id}/cccccccc-cccc-4ccc-8ccc-cccccccccccc`,
      uploadedAt: now,
      createdAt: now,
      updatedAt: now,
    },
  ]);
  const handReceiptRepository = new InMemoryHandReceiptRepository([
    {
      id: "88888888-8888-4888-8888-888888888888",
      accountId: account.id,
      name: "Primary receipt",
      notes: null,
      handReceiptNumber: null,
      holderName: null,
      unitName: null,
      uic: null,
      effectiveDate: null,
      status: "active",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "55555555-5555-4555-8555-555555555555",
      accountId: account.id,
      name: "Archived receipt",
      notes: null,
      handReceiptNumber: null,
      holderName: null,
      unitName: null,
      uic: null,
      effectiveDate: null,
      status: "archived",
      createdAt: now,
      updatedAt: now,
    },
  ]);
  const itemRepository = new InMemoryItemRepository([
    {
      id: "dddddddd-dddd-4ddd-9ddd-dddddddddddd",
      accountId: account.id,
      handReceiptId: "88888888-8888-4888-8888-888888888888",
      nomenclature: "Radio",
      ecn: "ECN-1",
      serialNumber: null,
      generatedId: null,
      notes: null,
      status: "active",
      signedToContactId: null,
      signedToContactName: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "77777777-7777-4777-9777-777777777777",
      accountId: account.id,
      handReceiptId: "88888888-8888-4888-8888-888888888888",
      nomenclature: "Generator",
      ecn: null,
      serialNumber: "SER-2",
      generatedId: null,
      notes: null,
      status: "active",
      signedToContactId: null,
      signedToContactName: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "99999999-9999-4999-9999-999999999998",
      accountId: account.id,
      handReceiptId: "66666666-6666-4666-8666-666666666666",
      nomenclature: "Other receipt item",
      ecn: "OTHER-1",
      serialNumber: null,
      generatedId: null,
      notes: null,
      status: "active",
      signedToContactId: null,
      signedToContactName: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "44444444-4444-4444-8444-444444444444",
      accountId: account.id,
      handReceiptId: "55555555-5555-4555-8555-555555555555",
      nomenclature: "Archived receipt item",
      ecn: "ARCH-1",
      serialNumber: null,
      generatedId: null,
      notes: null,
      status: "active",
      signedToContactId: null,
      signedToContactName: null,
      createdAt: now,
      updatedAt: now,
    },
  ]);
  const locationRepository = createEmptyLocationRepository();
  const requirementRepository = createEmptyRequirementRepository();
  const unitOfWork = createInMemoryAppUnitOfWork({
    accountRepository,
    assignmentItemLinkRepository,
    assignmentRepository,
    auditRepository,
    contactRepository,
    documentRepository,
    handReceiptRepository,
    itemRepository,
    locationRepository,
    requirementRepository,
  });

  return {
    assignmentItemLinkRepository,
    assignmentRepository,
    contactRepository,
    auditRepository,
    itemRepository,
    caller: appRouter.createCaller({
      session: { userId: account.userId, email: "owner@example.com" },
      account,
      accountRepository,
      assignmentItemLinkRepository,
      assignmentRepository,
      auditRepository,
      contactRepository,
      documentRepository,
      handReceiptRepository,
      itemRepository,
      locationRepository,
      requirementRepository,
      unitOfWork,
    }),
  };
}

describe("assignments2062Router", () => {
  it("creates a single-item 2062 through the typed procedure", async () => {
    const { caller, assignmentRepository, assignmentItemLinkRepository } =
      createCaller();

    const result = await caller.assignments2062.create({
      itemId: "dddddddd-dddd-4ddd-9ddd-dddddddddddd",
      contactId: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
      documentId: "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb",
    });

    expect(result.assignment).toMatchObject({ status: "active" });
    expect(assignmentRepository.assignments).toHaveLength(1);
    expect(assignmentItemLinkRepository.links).toHaveLength(1);
  });

  it("maps active coverage conflicts to CONFLICT", async () => {
    const { caller, assignmentItemLinkRepository } = createCaller();
    assignmentItemLinkRepository.links.push({
      id: "eeeeeeee-eeee-4eee-9eee-eeeeeeeeeeee",
      accountId: "account-1",
      assignmentId: "ffffffff-ffff-4fff-8fff-ffffffffffff",
      itemId: "dddddddd-dddd-4ddd-9ddd-dddddddddddd",
      status: "active",
      closedAt: null,
      createdAt: now,
      updatedAt: now,
    });

    await expect(
      caller.assignments2062.create({
        itemId: "dddddddd-dddd-4ddd-9ddd-dddddddddddd",
        contactId: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
        documentId: "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb",
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("creates a new lightweight contact inline", async () => {
    const { caller, contactRepository } = createCaller();

    const result = await caller.assignments2062.create({
      itemId: "dddddddd-dddd-4ddd-9ddd-dddddddddddd",
      contactDisplayName: "SGT Morgan",
      documentId: "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb",
    });

    expect(result.assignment.contactName).toBe("SGT Morgan");
    expect(contactRepository.contacts).toContainEqual(
      expect.objectContaining({
        accountId: "account-1",
        displayName: "SGT Morgan",
      }),
    );
  });

  it("validates that a contact selection is present", async () => {
    const { caller } = createCaller();

    await expect(
      caller.assignments2062.create({
        itemId: "dddddddd-dddd-4ddd-9ddd-dddddddddddd",
        documentId: "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb",
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("maps missing records to NOT_FOUND", async () => {
    const { caller } = createCaller();

    await expect(
      caller.assignments2062.create({
        itemId: "99999999-9999-4999-9999-999999999999",
        contactId: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
        documentId: "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb",
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    await expect(
      caller.assignments2062.create({
        itemId: "dddddddd-dddd-4ddd-9ddd-dddddddddddd",
        contactId: "99999999-9999-4999-9999-999999999999",
        documentId: "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb",
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    await expect(
      caller.assignments2062.create({
        itemId: "dddddddd-dddd-4ddd-9ddd-dddddddddddd",
        contactId: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
        documentId: "99999999-9999-4999-9999-999999999999",
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("maps read-only accounts to FORBIDDEN", async () => {
    const { caller } = createCaller(
      createAccount({ accessState: "paused_read_only" }),
    );

    await expect(
      caller.assignments2062.create({
        itemId: "dddddddd-dddd-4ddd-9ddd-dddddddddddd",
        contactId: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
        documentId: "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb",
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("maps archived hand receipt single-item creation to CONFLICT", async () => {
    const { caller, assignmentRepository, assignmentItemLinkRepository } =
      createCaller();

    await expect(
      caller.assignments2062.create({
        itemId: "44444444-4444-4444-8444-444444444444",
        contactId: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
        documentId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      }),
    ).rejects.toMatchObject({
      code: "CONFLICT",
      message: "Hand receipt must be active to upload a 2062.",
    });
    expect(assignmentRepository.assignments).toEqual([]);
    expect(assignmentItemLinkRepository.links).toEqual([]);
  });

  it("creates a multi-item 2062 through the typed procedure", async () => {
    const {
      caller,
      assignmentRepository,
      assignmentItemLinkRepository,
      auditRepository,
    } = createCaller();

    const result = await caller.assignments2062.createWithItems({
      handReceiptId: "88888888-8888-4888-8888-888888888888",
      itemIds: [
        "dddddddd-dddd-4ddd-9ddd-dddddddddddd",
        "77777777-7777-4777-9777-777777777777",
      ],
      contactId: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
      documentId: "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb",
    });

    expect(result.assignment).toMatchObject({ status: "active" });
    expect(result.links).toHaveLength(2);
    expect(assignmentRepository.assignments).toHaveLength(1);
    expect(assignmentItemLinkRepository.links).toHaveLength(2);
    expect(auditRepository.events.map((event) => event.action)).toEqual([
      "assignment.created",
      "assignment_item_link.created",
      "assignment_item_link.created",
    ]);
  });

  it("maps empty multi-item selection to BAD_REQUEST", async () => {
    const { caller } = createCaller();

    await expect(
      caller.assignments2062.createWithItems({
        handReceiptId: "88888888-8888-4888-8888-888888888888",
        itemIds: [],
        contactId: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
        documentId: "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb",
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("maps archived hand receipt multi-item creation to CONFLICT", async () => {
    const { caller, assignmentRepository, assignmentItemLinkRepository } =
      createCaller();

    await expect(
      caller.assignments2062.createWithItems({
        handReceiptId: "55555555-5555-4555-8555-555555555555",
        itemIds: ["44444444-4444-4444-8444-444444444444"],
        contactId: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
        documentId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      }),
    ).rejects.toMatchObject({
      code: "CONFLICT",
      message: "Hand receipt must be active to upload a 2062.",
    });
    expect(assignmentRepository.assignments).toEqual([]);
    expect(assignmentItemLinkRepository.links).toEqual([]);
  });

  it("maps cross-hand-receipt multi-item selection to CONFLICT", async () => {
    const { caller } = createCaller();

    await expect(
      caller.assignments2062.createWithItems({
        handReceiptId: "88888888-8888-4888-8888-888888888888",
        itemIds: [
          "dddddddd-dddd-4ddd-9ddd-dddddddddddd",
          "99999999-9999-4999-9999-999999999998",
        ],
        contactId: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
        documentId: "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb",
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("lists active formal 2062 assignments without manual signed-to records", async () => {
    const { caller, assignmentItemLinkRepository, assignmentRepository } =
      createCaller();

    await caller.assignments2062.createWithItems({
      handReceiptId: "88888888-8888-4888-8888-888888888888",
      itemIds: [
        "dddddddd-dddd-4ddd-9ddd-dddddddddddd",
        "77777777-7777-4777-9777-777777777777",
      ],
      contactId: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
      documentId: "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb",
    });
    const createdAssignment = assignmentRepository.assignments[0];
    const createdLink = assignmentItemLinkRepository.links[0];

    if (!createdAssignment || !createdLink) {
      throw new Error("Missing created assignment fixture.");
    }

    assignmentRepository.assignments[0] = {
      ...createdAssignment,
      contactName: "SPC Rivera",
      documentFilename: "signed-2062.pdf",
    };
    assignmentRepository.assignments.push({
      ...createdAssignment,
      id: "11111111-1111-4111-8111-111111111111",
      status: "closed",
      createdAt: new Date("2026-04-01T12:00:00.000Z"),
      updatedAt: new Date("2026-04-02T12:00:00.000Z"),
    });
    assignmentItemLinkRepository.links.push({
      ...createdLink,
      id: "22222222-2222-4222-8222-222222222222",
      assignmentId: "11111111-1111-4111-8111-111111111111",
      itemId: "99999999-9999-4999-9999-999999999998",
      status: "closed",
      closedAt: new Date("2026-04-02T12:00:00.000Z"),
      createdAt: new Date("2026-04-01T12:00:00.000Z"),
      updatedAt: new Date("2026-04-02T12:00:00.000Z"),
    });

    await expect(caller.assignments2062.list()).resolves.toEqual([
      expect.objectContaining({
        id: createdAssignment.id,
        contactName: "SPC Rivera",
        handReceiptName: "Primary receipt",
        itemCount: 2,
        status: "active",
      }),
    ]);
  });

  it("returns current and historical item coverage through the typed procedure", async () => {
    const { caller, assignmentItemLinkRepository, assignmentRepository } =
      createCaller();

    await caller.assignments2062.create({
      itemId: "dddddddd-dddd-4ddd-9ddd-dddddddddddd",
      contactId: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
      documentId: "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb",
    });
    const activeAssignment = assignmentRepository.assignments[0];
    const activeLink = assignmentItemLinkRepository.links[0];

    if (!activeAssignment || !activeLink) {
      throw new Error("Missing active assignment fixture.");
    }

    assignmentRepository.assignments[0] = {
      ...activeAssignment,
      contactName: "SPC Rivera",
      documentFilename: "signed-2062.pdf",
    };
    assignmentRepository.assignments.push({
      ...activeAssignment,
      id: "33333333-3333-4333-8333-333333333333",
      contactName: "SPC Rivera",
      documentFilename: "closed-2062.pdf",
      status: "closed",
      createdAt: new Date("2026-04-01T12:00:00.000Z"),
      updatedAt: new Date("2026-04-02T12:00:00.000Z"),
    });
    assignmentItemLinkRepository.links.push({
      ...activeLink,
      id: "44444444-4444-4444-8444-444444444444",
      assignmentId: "33333333-3333-4333-8333-333333333333",
      status: "closed",
      closedAt: new Date("2026-04-02T12:00:00.000Z"),
      createdAt: new Date("2026-04-01T12:00:00.000Z"),
      updatedAt: new Date("2026-04-02T12:00:00.000Z"),
    });
    assignmentItemLinkRepository.assignmentContexts.push({
      assignmentId: "33333333-3333-4333-8333-333333333333",
      handReceiptId: "88888888-8888-4888-8888-888888888888",
      handReceiptName: "Primary receipt",
      contactId: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
      contactName: "SPC Rivera",
      documentId: "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb",
      documentFilename: "closed-2062.pdf",
    });

    await expect(
      caller.assignments2062.getItemCoverage({
        itemId: "dddddddd-dddd-4ddd-9ddd-dddddddddddd",
      }),
    ).resolves.toMatchObject({
      current: {
        id: activeAssignment.id,
        contactName: "SPC Rivera",
        itemCount: 1,
      },
      history: [
        {
          assignmentId: "33333333-3333-4333-8333-333333333333",
          linkId: "44444444-4444-4444-8444-444444444444",
        },
      ],
    });
  });
});
