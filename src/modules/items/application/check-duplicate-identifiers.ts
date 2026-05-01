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

export async function checkDuplicateIdentifiers({
  accountId,
  ecn,
  serialNumber,
  excludeItemId,
  repository,
}: CheckDuplicateIdentifiersInput): Promise<DuplicateCheckResult> {
  const matches = await Promise.all([
    ecn ? repository.findByEcn(accountId, ecn) : Promise.resolve([]),
    serialNumber
      ? repository.findBySerialNumber(accountId, serialNumber)
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
