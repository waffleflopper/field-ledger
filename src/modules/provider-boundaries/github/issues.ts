export type CreateGitHubIssueInput = {
  body: string;
  labels: string[];
  title: string;
};

export type CreatedGitHubIssue = {
  number: number;
  url: string;
};

export type GitHubIssuesPort = {
  createIssue(input: CreateGitHubIssueInput): Promise<CreatedGitHubIssue>;
};

const FIELD_LEDGER_REPOSITORY = {
  owner: "waffleflopper",
  repo: "field-ledger",
};

function readGitHubToken() {
  return process.env.FIELD_LEDGER_GITHUB_TOKEN;
}

function createUnavailableGitHubIssuesPort(): GitHubIssuesPort {
  return {
    async createIssue() {
      throw new Error("A GitHub issue provider is required.");
    },
  };
}

export function createGitHubIssuesPortFromEnvironment(): GitHubIssuesPort {
  const token = readGitHubToken();

  if (!token) {
    return createUnavailableGitHubIssuesPort();
  }

  return createGitHubIssuesPort({ token });
}

export function createGitHubIssuesPort({
  token,
}: {
  token: string;
}): GitHubIssuesPort {
  return {
    async createIssue(input) {
      const response = await fetch(
        `https://api.github.com/repos/${FIELD_LEDGER_REPOSITORY.owner}/${FIELD_LEDGER_REPOSITORY.repo}/issues`,
        {
          body: JSON.stringify({
            title: input.title,
            body: input.body,
            labels: input.labels,
          }),
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "X-GitHub-Api-Version": "2022-11-28",
          },
          method: "POST",
        },
      );

      if (!response.ok) {
        throw new Error(`GitHub issue creation failed: ${response.status}`);
      }

      const data: unknown = await response.json();

      if (
        !data ||
        typeof data !== "object" ||
        !("number" in data) ||
        !("html_url" in data) ||
        typeof data.number !== "number" ||
        typeof data.html_url !== "string"
      ) {
        throw new Error("GitHub returned an unexpected issue response.");
      }

      return {
        number: data.number,
        url: data.html_url,
      };
    },
  };
}

export { createUnavailableGitHubIssuesPort };
