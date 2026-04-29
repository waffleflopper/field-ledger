const fallbackAppPath = "/app";

export function getSafeAuthRedirectPath(candidate: string | null) {
  if (!candidate) {
    return fallbackAppPath;
  }

  if (candidate.startsWith("//") || candidate.includes("\\")) {
    return fallbackAppPath;
  }

  try {
    const parsedUrl = new URL(candidate, "https://field-ledger.local");

    if (parsedUrl.origin !== "https://field-ledger.local") {
      return fallbackAppPath;
    }

    if (
      parsedUrl.pathname !== fallbackAppPath &&
      !parsedUrl.pathname.startsWith(`${fallbackAppPath}/`)
    ) {
      return fallbackAppPath;
    }

    return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
  } catch {
    return fallbackAppPath;
  }
}
