import { describe, expect, it } from "vitest";

import { InMemoryAssignmentItemLinkRepository } from "../../support/assignment-item-link-repository";
import { InMemoryAssignmentRepository } from "../../support/assignment-repository";

const older = new Date("2026-05-02T12:00:00.000Z");
const newer = new Date("2026-05-02T13:00:00.000Z");

describe("assignment test repositories", () => {
  it("matches assignment list ordering used by the database repository", async () => {
    const repository = new InMemoryAssignmentRepository([
      {
        id: "assignment-older",
        accountId: "account-1",
        handReceiptId: "receipt-1",
        contactId: "contact-1",
        contactName: null,
        documentId: "document-1",
        documentFilename: null,
        status: "active",
        createdAt: older,
        updatedAt: older,
      },
      {
        id: "assignment-newer",
        accountId: "account-1",
        handReceiptId: "receipt-1",
        contactId: "contact-1",
        contactName: null,
        documentId: "document-1",
        documentFilename: null,
        status: "active",
        createdAt: newer,
        updatedAt: newer,
      },
    ]);

    await expect(repository.findByAccountId("account-1")).resolves.toEqual([
      expect.objectContaining({ id: "assignment-newer" }),
      expect.objectContaining({ id: "assignment-older" }),
    ]);
  });

  it("rejects reactivating a second active link for the same item", async () => {
    const repository = new InMemoryAssignmentItemLinkRepository([
      {
        id: "active-link",
        accountId: "account-1",
        assignmentId: "assignment-1",
        itemId: "item-1",
        status: "active",
        closedAt: null,
        createdAt: older,
        updatedAt: older,
      },
      {
        id: "closed-link",
        accountId: "account-1",
        assignmentId: "assignment-2",
        itemId: "item-1",
        status: "closed",
        closedAt: older,
        createdAt: older,
        updatedAt: older,
      },
    ]);

    await expect(
      repository.updateStatus("account-1", "closed-link", "active", newer),
    ).rejects.toMatchObject({
      constraint: "assignment_item_links_one_active_item_idx",
    });
  });
});
