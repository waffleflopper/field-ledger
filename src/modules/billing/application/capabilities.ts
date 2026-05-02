import type { AccountCapabilities } from "@/modules/billing/application/types";

export function isAccountReadOnly(capabilities: AccountCapabilities) {
  return capabilities.isReadOnly;
}

export function getActiveHandReceiptLimit(capabilities: AccountCapabilities) {
  return capabilities.activeHandReceiptLimit;
}

export function canCreateHandReceipt(
  capabilities: AccountCapabilities,
  currentActiveHandReceiptCount: number,
) {
  if (capabilities.isReadOnly) {
    return false;
  }

  if (capabilities.activeHandReceiptLimit === null) {
    return true;
  }

  return currentActiveHandReceiptCount < capabilities.activeHandReceiptLimit;
}

export function canArchiveHandReceipt(capabilities: AccountCapabilities) {
  return !capabilities.isReadOnly;
}

export function canMoveItem(capabilities: AccountCapabilities) {
  return !capabilities.isReadOnly;
}

export function canCreateRequirement(capabilities: AccountCapabilities) {
  return !capabilities.isReadOnly;
}

export function canUploadDocument(capabilities: AccountCapabilities) {
  return !capabilities.isReadOnly;
}

export function canEditRequirement(capabilities: AccountCapabilities) {
  return !capabilities.isReadOnly;
}

export function canRestoreHandReceipt(
  capabilities: AccountCapabilities,
  currentActiveHandReceiptCount: number,
) {
  return canCreateHandReceipt(capabilities, currentActiveHandReceiptCount);
}
