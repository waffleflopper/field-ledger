import type { HandReceiptRepository } from "./hand-receipt-repository";

type ListActiveHandReceiptsInput = {
  accountId: string;
  repository: HandReceiptRepository;
};

export function listActiveHandReceipts({
  accountId,
  repository,
}: ListActiveHandReceiptsInput) {
  return repository.findByAccountId(accountId, { status: "active" });
}
