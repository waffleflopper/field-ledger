import type { ItemRepository } from "./item-repository";
import type { DuplicateCheckResult, ItemRecord } from "./types";

type CheckDuplicateIdentifiersInput = {
  accountId: string;
  ecn?: string | null;
  serialNumber?: string | null;
  excludeItemId?: string;
  repository: ItemRepository;
};

function byUniqueItem(items: ItemRecord[]) {
  return Array.from(new Map(items.map((item) => [item.id, item])).values());
}

function normalizeIdentifier(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function checkDuplicateIdentifiers({
  accountId,
  ecn,
  serialNumber,
  excludeItemId,
  repository,
}: CheckDuplicateIdentifiersInput): Promise<DuplicateCheckResult> {
  const normalizedEcn = normalizeIdentifier(ecn);
  const normalizedSerialNumber = normalizeIdentifier(serialNumber);
  const matches = await Promise.all([
    normalizedEcn
      ? repository.findByEcn(accountId, normalizedEcn)
      : Promise.resolve([]),
    normalizedSerialNumber
      ? repository.findBySerialNumber(accountId, normalizedSerialNumber)
      : Promise.resolve([]),
  ]);
  const existingItems = byUniqueItem(matches.flat()).filter(
    (item) => item.id !== excludeItemId,
  );

  return {
    hasDuplicate: existingItems.length > 0,
    existingItems,
  };
}
