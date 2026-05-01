import type { HandReceiptRepository } from "./hand-receipt-repository";
import type { HandReceiptStatus } from "./types";

type HandReceiptListStatus = HandReceiptStatus | "all";

type ListHandReceiptsInput = {
  accountId: string;
  status?: HandReceiptListStatus;
  repository: HandReceiptRepository;
};

export function listHandReceipts({
  accountId,
  status = "active",
  repository,
}: ListHandReceiptsInput) {
  return repository.findByAccountId(
    accountId,
    status === "all" ? undefined : { status },
  );
}

export function listActiveHandReceipts(
  input: Omit<ListHandReceiptsInput, "status">,
) {
  return listHandReceipts({ ...input, status: "active" });
}

export function listArchivedHandReceipts(
  input: Omit<ListHandReceiptsInput, "status">,
) {
  return listHandReceipts({ ...input, status: "archived" });
}
