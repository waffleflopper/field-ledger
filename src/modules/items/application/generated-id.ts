import type { AccountRepository } from "@/modules/accounts/application/ensure-account";

export function formatGeneratedId(sequence: number) {
  if (!Number.isInteger(sequence) || sequence < 1) {
    throw new Error("Generated item sequence must be a positive integer.");
  }

  return `FL-${sequence.toString().padStart(6, "0")}`;
}

export async function allocateGeneratedId({
  accountId,
  accountRepository,
}: {
  accountId: string;
  accountRepository: Pick<AccountRepository, "incrementAndGetNextItemSequence">;
}) {
  const sequence =
    await accountRepository.incrementAndGetNextItemSequence(accountId);

  return formatGeneratedId(sequence);
}
