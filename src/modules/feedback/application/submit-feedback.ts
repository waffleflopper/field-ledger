import type {
  CreatedGitHubIssue,
  GitHubIssuesPort,
} from "@/modules/provider-boundaries/github/issues";

const FEEDBACK_LABELS = ["needs-triage", "feedback"];
const MAX_FEEDBACK_LENGTH = 5000;

export type SubmitFeedbackInput = {
  message: string;
  pageUrl?: string;
};

export type SubmitFeedbackResult = CreatedGitHubIssue;

function normalizeFeedbackMessage(message: string) {
  return message.trim();
}

function buildFeedbackIssueBody({
  message,
  pageUrl,
}: {
  message: string;
  pageUrl?: string;
}) {
  return [
    "## Feedback",
    "",
    message,
    "",
    "## Filed from Field Ledger",
    "",
    "- Source: in-app feedback",
    ...(pageUrl ? [`- Page: ${pageUrl}`] : []),
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
