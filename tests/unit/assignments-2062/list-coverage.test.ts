import { describe, expect, it } from "vitest";

import type { AccountRecord } from "@/modules/accounts/application/ensure-account";
import {
  getHandReceiptAssignments,
  getItemCoverage,
  listActiveAssignments,
} from "@/modules/assignments-2062";
import { InMemoryAssignmentItemLinkRepository } from "../../support/assignment-item-link-repository";
import { InMemoryAssignmentRepository } from "../../support/assignment-repository";
import { InMemoryHandReceiptRepository } from "../../support/hand-receipt-repository";

const older = new Date("2026-05-01T12:00:00.000Z");
const newer = new Date("2026-05-02T12:00:00.000Z");

const account: AccountRecord = {
  id: "account-1",
  userId: "owner-1",
  accessState: "active",
  subscriptionTier: "base",
  trialStartsAt: new Date("2026-04-01T12:00:00.000Z"),
  trialEndsAt: new Date("2100-01-01T00:00:00.000Z"),
  onboardingCompletedAt: null,
};

function createRepositories() {
  const assignmentRepository = new InMemoryAssignmentRepository([
    {
      id: "assignment-active",
      accountId: account.id,
      handReceiptId: "receipt-1",
      contactId: "contact-1",
      contactName: "SPC Rivera",
      documentId: "document-1",
      documentFilename: "active-2062.pdf",
      status: "active",
      createdAt: newer,
      updatedAt: newer,
    },
    {
      id: "assignment-closed",
      accountId: account.id,
      handReceiptId: "receipt-1",
      contactId: "contact-2",
      contactName: "SGT Morgan",
      documentId: "document-2",
      documentFilename: "closed-2062.pdf",
      status: "closed",
      createdAt: older,
      updatedAt: older,
    },
  ]);
  const assignmentItemLinkRepository = new InMemoryAssignmentItemLinkRepository(
    [
      {
        id: "link-active-1",
        accountId: account.id,
        assignmentId: "assignment-active",
        itemId: "item-1",
        status: "active",
        closedAt: null,
        createdAt: newer,
        updatedAt: newer,
      },
      {
        id: "link-active-2",
        accountId: account.id,
        assignmentId: "assignment-active",
        itemId: "item-2",
        status: "active",
        closedAt: null,
        createdAt: newer,
        updatedAt: newer,
      },
      {
        id: "link-closed",
        accountId: account.id,
        assignmentId: "assignment-closed",
        itemId: "item-1",
        status: "closed",
        closedAt: newer,
        createdAt: older,
        updatedAt: newer,
      },
    ],
    [
      {
        assignmentId: "assignment-active",
        handReceiptId: "receipt-1",
        handReceiptName: "Primary receipt",
        contactId: "contact-1",
        contactName: "SPC Rivera",
        documentId: "document-1",
        documentFilename: "active-2062.pdf",
      },
      {
        assignmentId: "assignment-closed",
        handReceiptId: "receipt-1",
        handReceiptName: "Primary receipt",
        contactId: "contact-2",
        contactName: "SGT Morgan",
        documentId: "document-2",
        documentFilename: "closed-2062.pdf",
      },
    ],
  );
  const handReceiptRepository = new InMemoryHandReceiptRepository([
    {
      id: "receipt-1",
      accountId: account.id,
      name: "Primary receipt",
      notes: null,
      handReceiptNumber: null,
      holderName: null,
      unitName: null,
      uic: null,
      effectiveDate: null,
      status: "active",
      createdAt: older,
      updatedAt: older,
    },
  ]);

  return {
    assignmentItemLinkRepository,
    assignmentRepository,
    handReceiptRepository,
  };
}

describe("2062 list and coverage queries", () => {
  it("lists active formal assignments with hand receipt context and item counts", async () => {
    const repositories = createRepositories();

    await expect(
      listActiveAssignments({ account, ...repositories }),
    ).resolves.toEqual([
      expect.objectContaining({
        id: "assignment-active",
        contactName: "SPC Rivera",
        documentFilename: "active-2062.pdf",
        handReceiptName: "Primary receipt",
        itemCount: 2,
        status: "active",
      }),
    ]);
  });

  it("separates current and historical 2062 coverage for an item", async () => {
    const repositories = createRepositories();

    await expect(
      getItemCoverage({ account, itemId: "item-1", ...repositories }),
    ).resolves.toMatchObject({
      current: {
        id: "assignment-active",
        contactName: "SPC Rivera",
        itemCount: 2,
      },
      history: [
        {
          assignmentId: "assignment-closed",
          contactName: "SGT Morgan",
          documentFilename: "closed-2062.pdf",
          handReceiptName: "Primary receipt",
          linkId: "link-closed",
        },
      ],
    });
  });

  it("returns multiple historical links newest first without per-link assignment lookups", async () => {
    const repositories = createRepositories();

    repositories.assignmentRepository.assignments.push({
      id: "assignment-older-closed",
      accountId: account.id,
      handReceiptId: "receipt-1",
      contactId: "contact-3",
      contactName: "SSG Carter",
      documentId: "document-3",
      documentFilename: "older-2062.pdf",
      status: "closed",
      createdAt: older,
      updatedAt: older,
    });
    repositories.assignmentItemLinkRepository.links.push({
      id: "link-older-closed",
      accountId: account.id,
      assignmentId: "assignment-older-closed",
      itemId: "item-1",
      status: "closed",
      closedAt: older,
      createdAt: older,
      updatedAt: older,
    });
    repositories.assignmentItemLinkRepository.assignmentContexts.push({
      assignmentId: "assignment-older-closed",
      handReceiptId: "receipt-1",
      handReceiptName: "Primary receipt",
      contactId: "contact-3",
      contactName: "SSG Carter",
      documentId: "document-3",
      documentFilename: "older-2062.pdf",
    });

    let assignmentFinds = 0;
    const originalFindById = repositories.assignmentRepository.findById.bind(
      repositories.assignmentRepository,
    );
    repositories.assignmentRepository.findById = async (...args) => {
      assignmentFinds += 1;
      return originalFindById(...args);
    };

    const coverage = await getItemCoverage({
      account,
      itemId: "item-1",
      ...repositories,
    });

    expect(coverage.history).toMatchObject([
      {
        assignmentId: "assignment-closed",
        contactName: "SGT Morgan",
        documentFilename: "closed-2062.pdf",
      },
      {
        assignmentId: "assignment-older-closed",
        contactName: "SSG Carter",
        documentFilename: "older-2062.pdf",
      },
    ]);
    expect(assignmentFinds).toBe(1);
  });

  it("scopes hand receipt assignment context to active formal assignments", async () => {
    const repositories = createRepositories();

    await expect(
      getHandReceiptAssignments({
        account,
        handReceiptId: "receipt-1",
        ...repositories,
      }),
    ).resolves.toEqual([
      expect.objectContaining({
        id: "assignment-active",
        handReceiptId: "receipt-1",
        itemCount: 2,
      }),
    ]);
  });
});
