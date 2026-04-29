import { expect, test } from "@playwright/test";

test("scaffold page renders the typed API foundation status", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: "Personal property accountability, scaffolded for the real app.",
    }),
  ).toBeVisible();
  await expect(page.getByText("Next.js App Router")).toBeVisible();
  await expect(page.getByText("Tailwind v4")).toBeVisible();
  await expect(page.getByText("shadcn/ui")).toBeVisible();
  await expect(
    page.getByText("Typed API foundation: trpc + tanstack-query ok"),
  ).toBeVisible();
});
