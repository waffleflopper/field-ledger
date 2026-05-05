import type {
  CreatedGitHubIssue,
  GitHubIssuesPort,
} from "@/modules/provider-boundaries/github/issues";

const FEEDBACK_LABELS = ["needs-triage", "feedback"];
const MAX_FEEDBACK_LENGTH = 5000;
const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const UUID_PATTERN =
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi;
const FIELD_LEDGER_IDENTIFIER_PATTERN =
  /\b(?:account|auth|auth-subject|provider|subject|user|owner)[-_][a-z0-9][a-z0-9_-]*\b/gi;

export type SubmitFeedbackInput = {
  message: string;
  pageUrl?: string;
};

export type SubmitFeedbackResult = CreatedGitHubIssue;

function normalizeFeedbackMessage(message: string) {
  return message.trim();
}

function redactFeedbackText(text: string) {
  return text
    .replace(EMAIL_PATTERN, "[redacted email]")
    .replace(UUID_PATTERN, "[redacted id]")
    .replace(FIELD_LEDGER_IDENTIFIER_PATTERN, "[redacted id]");
}

function sanitizeFeedbackPageUrl(pageUrl: string | undefined) {
  if (!pageUrl) {
    return undefined;
  }

  try {
    const url = new URL(pageUrl);
    return `${url.origin}${url.pathname}`;
  } catch {
    return undefined;
  }
}

function buildFeedbackIssueBody({
  message,
  pageUrl,
}: {
  message: string;
  pageUrl?: string;
}) {
  const redactedMessage = redactFeedbackText(message);
  const safePageUrl = sanitizeFeedbackPageUrl(pageUrl);

  return [
    "## Feedback",
    "",
    redactedMessage,
    "",
    "## Filed from Field Ledger",
    "",
    "- Source: in-app feedback",
    ...(safePageUrl ? [`- Page: ${safePageUrl}`] : []),
  ].join("\n");
}

export async function submitFeedback({
  feedbackPort,
  input,
}: {
  feedbackPort: GitHubIssuesPort;
  input: SubmitFeedbackInput;
}): Promise<SubmitFeedbackResult> {
  const message = normalizeFeedbackMessage(input.message);

  if (!message) {
    throw new Error("Feedback message is required.");
  }

  if (message.length > MAX_FEEDBACK_LENGTH) {
    throw new Error("Feedback message must be 5,000 characters or fewer.");
  }

  return feedbackPort.createIssue({
    body: buildFeedbackIssueBody({
      message,
      ...(input.pageUrl ? { pageUrl: input.pageUrl } : {}),
    }),
    labels: FEEDBACK_LABELS,
    title: "Field Ledger feedback",
  });
}
