import type { AccountRecord } from "@/modules/accounts/application/ensure-account";
import type { HandReceiptRepository } from "@/modules/hand-receipts";
import type { AssignmentItemLinkRepository } from "./assignment-item-link-repository";
import type { AssignmentRepository } from "./assignment-repository";
import type {
  ActiveAssignmentSummary,
  AssignmentRecord,
  HistoricalAssignmentLink,
  ItemCoverageResult,
} from "./types";

type AssignmentQueryDependencies = {
  account: AccountRecord;
  assignmentItemLinkRepository: AssignmentItemLinkRepository;
  assignmentRepository: AssignmentRepository;
  handReceiptRepository: HandReceiptRepository;
};

type SummaryDependencies = Omit<
  AssignmentQueryDependencies,
  "assignmentRepository"
> & {
  assignment: AssignmentRecord;
};

type CoverageHistoryEntryDependencies = {
  closedAt: Date | null;
  createdAt: Date;
  linkId: string;
  assignmentId: string;
  handReceiptId: string;
  handReceiptName: string;
  contactId: string;
  contactName: string;
  documentId: string;
  documentFilename: string;
};

async function toActiveAssignmentSummary({
  account,
  assignment,
  assignmentItemLinkRepository,
  handReceiptRepository,
}: SummaryDependencies): Promise<ActiveAssignmentSummary | null> {
  if (assignment.status !== "active") {
    return null;
  }

  const [handReceipt, activeLinks] = await Promise.all([
    handReceiptRepository.findById(account.id, assignment.handReceiptId),
    assignmentItemLinkRepository.findByAssignmentId(account.id, assignment.id, {
      status: "active",
    }),
  ]);

  if (!handReceipt) {
    return null;
  }

  return {
    id: assignment.id,
    handReceiptId: assignment.handReceiptId,
    handReceiptName: handReceipt.name,
    contactId: assignment.contactId,
    contactName: assignment.contactName ?? "Unknown contact",
    documentId: assignment.documentId,
    documentFilename: assignment.documentFilename ?? "2062 document",
    itemCount: activeLinks.length,
    status: "active",
    createdAt: assignment.createdAt,
    updatedAt: assignment.updatedAt,
  };
}

function coverageEntryToHistoricalAssignmentLink({
  assignmentId,
  closedAt,
  contactId,
  contactName,
  createdAt,
  documentFilename,
  documentId,
  handReceiptId,
  handReceiptName,
  linkId,
}: CoverageHistoryEntryDependencies): HistoricalAssignmentLink | null {
  if (!closedAt) {
    return null;
  }

  return {
    linkId,
    assignmentId,
    handReceiptId,
    handReceiptName,
    contactId,
    contactName,
    documentId,
    documentFilename,
    closedAt,
    createdAt,
  };
}

export async function listActiveAssignments({
  account,
  assignmentItemLinkRepository,
  assignmentRepository,
  handReceiptRepository,
}: AssignmentQueryDependencies): Promise<ActiveAssignmentSummary[]> {
  const assignments = await assignmentRepository.findByAccountId(account.id, {
    status: "active",
  });

  const summaries = await Promise.all(
    assignments.map((assignment) =>
      toActiveAssignmentSummary({
        account,
        assignment,
        assignmentItemLinkRepository,
        handReceiptRepository,
      }),
    ),
  );

  return summaries.filter((summary): summary is ActiveAssignmentSummary =>
    Boolean(summary),
  );
}

export async function getHandReceiptAssignments({
  account,
  assignmentItemLinkRepository,
  assignmentRepository,
  handReceiptId,
  handReceiptRepository,
}: AssignmentQueryDependencies & {
  handReceiptId: string;
}): Promise<ActiveAssignmentSummary[]> {
  const assignments = await assignmentRepository.findByHandReceiptId(
    account.id,
    handReceiptId,
    { status: "active" },
  );

  const summaries = await Promise.all(
    assignments.map((assignment) =>
      toActiveAssignmentSummary({
        account,
        assignment,
        assignmentItemLinkRepository,
        handReceiptRepository,
      }),
    ),
  );

  return summaries.filter((summary): summary is ActiveAssignmentSummary =>
    Boolean(summary),
  );
}

export async function getItemCoverage({
  account,
  assignmentItemLinkRepository,
  assignmentRepository,
  handReceiptRepository,
  itemId,
}: AssignmentQueryDependencies & {
  itemId: string;
}): Promise<ItemCoverageResult> {
  const [activeLink, historicalEntries] = await Promise.all([
    assignmentItemLinkRepository.findActiveByItemId(account.id, itemId),
    assignmentItemLinkRepository.findByItemIdWithAssignment(
      account.id,
      itemId,
      {
        status: "closed",
      },
    ),
  ]);

  const activeAssignment = activeLink
    ? await assignmentRepository.findById(account.id, activeLink.assignmentId)
    : null;
  const current = activeAssignment
    ? await toActiveAssignmentSummary({
        account,
        assignment: activeAssignment,
        assignmentItemLinkRepository,
        handReceiptRepository,
      })
    : null;

  const history = historicalEntries.map(
    coverageEntryToHistoricalAssignmentLink,
  );

  return {
    current,
    history: history.filter((link): link is HistoricalAssignmentLink =>
      Boolean(link),
    ),
  };
}
