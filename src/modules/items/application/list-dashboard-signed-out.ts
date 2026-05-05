import type { HandReceiptRepository } from "@/modules/hand-receipts";

import type { ItemRepository } from "./item-repository";
import type {
  Dashboard2062SignedOutRow,
  DashboardManualSignedOutRow,
  DashboardSignedOutResult,
  ItemRecord,
} from "./types";

const DASHBOARD_SIGNED_OUT_LIMIT = 10;

export type ListDashboardSignedOutInput = {
  accountId: string;
  handReceiptRepository: HandReceiptRepository;
  itemRepository: ItemRepository;
  limitPerGroup?: number;
};

function getItemIdentifier(item: ItemRecord) {
  return item.ecn ?? item.serialNumber ?? item.generatedId ?? "No identifier";
}

function mapManualItem(
  item: ItemRecord,
  handReceiptNameById: Map<string, string>,
): DashboardManualSignedOutRow {
  return {
    itemId: item.id,
    nomenclature: item.nomenclature,
    identifier: getItemIdentifier(item),
    handReceiptId: item.handReceiptId,
    handReceiptName:
      handReceiptNameById.get(item.handReceiptId) ?? "Unknown hand receipt",
    signedToName: item.signedToContactName ?? "Unknown contact",
    coverageType: "manual",
    assignmentId: null,
    documentFilename: null,
  };
}

function mapCoveredItem(
  item: ItemRecord,
  handReceiptNameById: Map<string, string>,
): Dashboard2062SignedOutRow {
  const coverage = item.active2062Coverage;

  if (!coverage) {
    throw new Error(
      "Active 2062 coverage is required for covered dashboard rows.",
    );
  }

  return {
    itemId: item.id,
    nomenclature: item.nomenclature,
    identifier: getItemIdentifier(item),
    handReceiptId: item.handReceiptId,
    handReceiptName:
      handReceiptNameById.get(item.handReceiptId) ?? "Unknown hand receipt",
    signedToName: coverage.contactName,
    coverageType: "da2062",
    assignmentId: coverage.assignmentId,
    documentFilename: coverage.documentFilename,
  };
}

export async function listDashboardSignedOut({
  accountId,
  handReceiptRepository,
  itemRepository,
  limitPerGroup = DASHBOARD_SIGNED_OUT_LIMIT,
}: ListDashboardSignedOutInput): Promise<DashboardSignedOutResult> {
  const items = await itemRepository.findByAccountId(accountId, {
    status: "active",
  });
  const signedOutItems = items.filter(
    (item) => item.signedToContactId || item.active2062Coverage,
  );
  const handReceiptIds = [
    ...new Set(signedOutItems.map((item) => item.handReceiptId)),
  ];
  const handReceipts =
    handReceiptIds.length > 0
      ? await handReceiptRepository.findManyByIds(accountId, handReceiptIds)
      : [];
  const handReceiptNameById = new Map(
    handReceipts.map((handReceipt) => [handReceipt.id, handReceipt.name]),
  );
  const result: DashboardSignedOutResult = {
    manualItems: [],
    coveredItems: [],
  };

  for (const item of signedOutItems) {
    if (item.active2062Coverage && result.coveredItems.length < limitPerGroup) {
      result.coveredItems.push(mapCoveredItem(item, handReceiptNameById));
      continue;
    }

    if (
      item.signedToContactId &&
      !item.active2062Coverage &&
      result.manualItems.length < limitPerGroup
    ) {
      result.manualItems.push(mapManualItem(item, handReceiptNameById));
    }
  }

  return result;
}
