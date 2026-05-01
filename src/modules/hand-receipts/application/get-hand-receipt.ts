import type { HandReceiptRepository } from "./hand-receipt-repository";

type GetHandReceiptInput = {
  accountId: string;
  handReceiptId: string;
  repository: HandReceiptRepository;
};

export function getHandReceipt({
  accountId,
  handReceiptId,
  repository,
}: GetHandReceiptInput) {
  return repository.findById(accountId, handReceiptId);
}
