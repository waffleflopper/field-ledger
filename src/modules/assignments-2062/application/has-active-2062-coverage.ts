import type { AssignmentItemLinkRepository } from "./assignment-item-link-repository";

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
