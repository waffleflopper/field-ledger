import { afterEach, describe, expect, it, vi } from "vitest";

import { createGitHubIssuesPort } from "@/modules/provider-boundaries/github/issues";

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("createGitHubIssuesPort", () => {
  it("creates a GitHub issue through the configured repository endpoint", async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          html_url: "https://github.com/waffleflopper/field-ledger/issues/42",
          number: 42,
        }),
        { status: 201 },
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const port = createGitHubIssuesPort({ token: "field-ledger-token" });

    await expect(
      port.createIssue({
        body: "Feedback body",
        labels: ["needs-triage", "feedback"],
        title: "Field Ledger feedback",
      }),
    ).resolves.toEqual({
      number: 42,
      url: "https://github.com/waffleflopper/field-ledger/issues/42",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.github.com/repos/waffleflopper/field-ledger/issues",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer field-ledger-token",
        }),
        method: "POST",
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it("times out slow GitHub issue creation requests", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn(
      (_url: string | URL | Request, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "AbortError"));
          });
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const port = createGitHubIssuesPort({
      timeoutMs: 25,
      token: "field-ledger-token",
    });
    const createIssue = port.createIssue({
      body: "Feedback body",
      labels: ["needs-triage", "feedback"],
      title: "Field Ledger feedback",
    });
    const expectation = expect(createIssue).rejects.toThrow(
      "GitHub issue creation timed out.",
    );

    await vi.advanceTimersByTimeAsync(25);
    await expectation;
  });
});
