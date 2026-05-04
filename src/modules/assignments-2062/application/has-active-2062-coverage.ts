import type { AssignmentItemLinkRepository } from "./assignment-item-link-repository";

export type Active2062CoverageInfo = {
  hasActiveCoverage: true;
  itemLinkId: string;
  assignmentId: string;
  isLastActiveLink: boolean;
};

export async function hasActive2062Coverage({
  accountId,
  itemId,
  assignmentItemLinkRepository,
}: {
  accountId: string;
  itemId: string;
  assignmentItemLinkRepository: AssignmentItemLinkRepository;
}) {
  const link = await assignmentItemLinkRepository.findActiveByItemId(
    accountId,
    itemId,
  );

  return link !== null;
}

export async function getActive2062CoverageInfo({
  accountId,
  itemId,
  assignmentItemLinkRepository,
}: {
  accountId: string;
  itemId: string;
  assignmentItemLinkRepository: AssignmentItemLinkRepository;
}): Promise<Active2062CoverageInfo | null> {
  const link = await assignmentItemLinkRepository.findActiveByItemId(
    accountId,
    itemId,
  );

  if (!link) {
    return null;
  }

  const activeAssignmentLinks =
    await assignmentItemLinkRepository.findByAssignmentId(
      accountId,
      link.assignmentId,
      { status: "active" },
    );

  return {
    hasActiveCoverage: true,
    itemLinkId: link.id,
    assignmentId: link.assignmentId,
    isLastActiveLink: activeAssignmentLinks.length === 1,
  };
}
