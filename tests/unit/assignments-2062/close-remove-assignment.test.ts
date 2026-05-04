import { describe, expect, it } from "vitest";

import type { AccountRecord } from "@/modules/accounts/application/ensure-account";
import {
  AccountReadOnlyError,
  AssignmentAlreadyClosedError,
  closeAssignment,
  CloseDateFutureError,
  removeAssignmentItemLink,
} from "@/modules/assignments-2062";
import { InMemoryAssignmentItemLinkRepository } from "../../support/assignment-item-link-repository";
import { InMemoryAssignmentRepository } from "../../support/assignment-repository";
import { InMemoryAuditRepository } from "../../support/audit-repository";
import { InMemoryItemRepository } from "../../support/item-repository";

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

function createRepositories() {
  return {
    assignmentRepository: new InMemoryAssignmentRepository([
      {
        id: "assignment-1",
        accountId: "account-1",
        handReceiptId: "receipt-1",
        contactId: "contact-1",
        contactName: "SPC Rivera",
        documentId: "document-1",
        documentFilename: "signed-2062.pdf",
        status: "active",
        createdAt: now,
        updatedAt: now,
      },
    ]),
    assignmentItemLinkRepository: new InMemoryAssignmentItemLinkRepository([
      {
        id: "link-1",
        accountId: "account-1",
        assignmentId: "assignment-1",
        itemId: "item-1",
        status: "active",
        closedAt: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "link-2",
        accountId: "account-1",
        assignmentId: "assignment-1",
        itemId: "item-2",
        status: "active",
        closedAt: null,
        createdAt: now,
        updatedAt: now,
      },
    ]),
    auditRepository: new InMemoryAuditRepository(),
    itemRepository: new InMemoryItemRepository([
      {
        id: "item-1",
        accountId: "account-1",
        handReceiptId: "receipt-1",
        nomenclature: "Radio",
        ecn: "ECN-1",
        serialNumber: null,
        generatedId: null,
        notes: null,
        status: "active",
        signedToContactId: "contact-1",
        signedToContactName: "SPC Rivera",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "item-2",
        accountId: "account-1",
        handReceiptId: "receipt-1",
        nomenclature: "Generator",
        ecn: null,
        serialNumber: "SER-2",
        generatedId: null,
        notes: null,
        status: "active",
        signedToContactId: "contact-1",
        signedToContactName: "SPC Rivera",
        createdAt: now,
        updatedAt: now,
      },
    ]),
  };
}

describe("closeAssignment", () => {
  it("closes an active assignment, closes all item links, clears signed-to state, and records activity", async () => {
    const repositories = createRepositories();

    const result = await closeAssignment({
      account: createAccount(),
      actorId: "owner-1",
      assignmentId: "assignment-1",
      closedOn: "2026-05-01",
      ...repositories,
      now,
    });

    expect(result?.assignment).toMatchObject({
      id: "assignment-1",
      status: "closed",
      contactName: "SPC Rivera",
      documentFilename: "signed-2062.pdf",
    });
    expect(result?.closedItemLinks).toBe(2);
    expect(repositories.assignmentItemLinkRepository.links).toEqual([
      expect.objectContaining({
        id: "link-1",
        status: "closed",
        closedAt: new Date("2026-05-01T12:00:00.000Z"),
      }),
      expect.objectContaining({
        id: "link-2",
        status: "closed",
        closedAt: new Date("2026-05-01T12:00:00.000Z"),
      }),
    ]);
    await expect(
      repositories.itemRepository.findById("account-1", "item-1"),
    ).resolves.toMatchObject({ signedToContactId: null });
    await expect(
      repositories.itemRepository.findById("account-1", "item-2"),
    ).resolves.toMatchObject({ signedToContactId: null });
    expect(repositories.auditRepository.events).toEqual([
      expect.objectContaining({
        action: "assignment.closed",
        metadata: expect.objectContaining({
          closedOn: "2026-05-01",
          contactName: "SPC Rivera",
          handReceiptId: "receipt-1",
          itemCount: 2,
        }),
      }),
    ]);
    await expect(
      repositories.auditRepository.listByTarget("account-1", {
        targetType: "hand_receipt",
        targetId: "receipt-1",
      }),
    ).resolves.toEqual([
      expect.objectContaining({
        action: "assignment.closed",
      }),
    ]);
  });

  it("defaults close date to today and allows past dates, but blocks future dates", async () => {
    const defaultDateRepositories = createRepositories();
    await closeAssignment({
      account: createAccount(),
      actorId: "owner-1",
      assignmentId: "assignment-1",
      ...defaultDateRepositories,
      now,
    });
    expect(
      defaultDateRepositories.assignmentItemLinkRepository.links[0],
    ).toMatchObject({
      closedAt: new Date("2026-05-02T12:00:00.000Z"),
    });

    const futureDateRepositories = createRepositories();
    await expect(
      closeAssignment({
        account: createAccount(),
        actorId: "owner-1",
        assignmentId: "assignment-1",
        closedOn: "2026-05-03",
        ...futureDateRepositories,
        now,
      }),
    ).rejects.toBeInstanceOf(CloseDateFutureError);
  });

  it("blocks read-only accounts and already-closed assignments", async () => {
    const readOnlyRepositories = createRepositories();
    await expect(
      closeAssignment({
        account: createAccount({ accessState: "paused_read_only" }),
        actorId: "owner-1",
        assignmentId: "assignment-1",
        ...readOnlyRepositories,
        now,
      }),
    ).rejects.toBeInstanceOf(AccountReadOnlyError);
    expect(readOnlyRepositories.assignmentItemLinkRepository.links).toEqual(
      expect.arrayContaining([expect.objectContaining({ status: "active" })]),
    );

    const closedRepositories = createRepositories();
    closedRepositories.assignmentRepository.assignments[0] = {
      ...closedRepositories.assignmentRepository.assignments[0]!,
      status: "closed",
    };
    await expect(
      closeAssignment({
        account: createAccount(),
        actorId: "owner-1",
        assignmentId: "assignment-1",
        ...closedRepositories,
        now,
      }),
    ).rejects.toBeInstanceOf(AssignmentAlreadyClosedError);
  });
});

describe("removeAssignmentItemLink", () => {
  it("removes one item from a multi-item assignment without closing the assignment", async () => {
    const repositories = createRepositories();

    const result = await removeAssignmentItemLink({
      account: createAccount(),
      actorId: "owner-1",
      itemLinkId: "link-1",
      closedOn: "2026-05-01",
      ...repositories,
      now,
    });

    expect(result).toMatchObject({
      link: expect.objectContaining({ id: "link-1", status: "closed" }),
      assignmentClosed: false,
    });
    expect(repositories.assignmentRepository.assignments[0]).toMatchObject({
      status: "active",
    });
    expect(repositories.assignmentItemLinkRepository.links).toEqual([
      expect.objectContaining({ id: "link-1", status: "closed" }),
      expect.objectContaining({ id: "link-2", status: "active" }),
    ]);
    await expect(
      repositories.itemRepository.findById("account-1", "item-1"),
    ).resolves.toMatchObject({ signedToContactId: null });
    await expect(
      repositories.itemRepository.findById("account-1", "item-2"),
    ).resolves.toMatchObject({ signedToContactId: "contact-1" });
    expect(
      repositories.auditRepository.events.map((event) => event.action),
    ).toEqual(["assignment_item_link.removed"]);
    expect(repositories.auditRepository.events[0]?.metadata).toMatchObject({
      handReceiptId: "receipt-1",
      name: "Radio",
    });
    await expect(
      repositories.auditRepository.listByTarget("account-1", {
        targetType: "hand_receipt",
        targetId: "receipt-1",
      }),
    ).resolves.toEqual([
      expect.objectContaining({
        action: "assignment_item_link.removed",
      }),
    ]);
  });

  it("auto-closes the assignment when the last active item link is removed", async () => {
    const repositories = createRepositories();
    repositories.assignmentItemLinkRepository.links =
      repositories.assignmentItemLinkRepository.links.slice(0, 1);

    const result = await removeAssignmentItemLink({
      account: createAccount(),
      actorId: "owner-1",
      itemLinkId: "link-1",
      ...repositories,
      now,
    });

    expect(result).toMatchObject({
      assignmentClosed: true,
      assignment: expect.objectContaining({ status: "closed" }),
    });
    expect(repositories.assignmentRepository.assignments[0]).toMatchObject({
      status: "closed",
    });
    expect(
      repositories.auditRepository.events.map((event) => event.action),
    ).toEqual(["assignment_item_link.removed", "assignment.closed"]);
  });
});
