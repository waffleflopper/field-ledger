type ItemIdentifiersInput = {
  ecn?: string | null;
  serialNumber?: string | null;
  generatedId?: string | null;
};

export type ItemIdentifierValidationResult =
  | { ok: true }
  | {
      ok: false;
      reason: "missing_identifier";
      message: "Provide an ECN, serial number, or generated ID.";
    };

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim());
}

export function validateItemIdentifiers({
  ecn,
  serialNumber,
  generatedId,
}: ItemIdentifiersInput): ItemIdentifierValidationResult {
  if (hasText(ecn) || hasText(serialNumber) || hasText(generatedId)) {
    return { ok: true };
  }

  return {
    ok: false,
    reason: "missing_identifier",
    message: "Provide an ECN, serial number, or generated ID.",
  };
}
