import { expect, type Page, test } from "@playwright/test";

async function signInNewLocalUser(page: Page) {
  const suffix = `${Date.now()}-${test.info().workerIndex}-${Math.random().toString(36).slice(2)}`;
  const email = `onboarding-${suffix}@example.test`;

  await page.goto("/auth/login?next=/app");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password");
  await page.getByRole("button", { name: "Create local user" }).click();
  await expect(page).toHaveURL(/\/app\/dashboard$/);
}

test("first-run users see and acknowledge the Field Ledger boundary notice", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signInNewLocalUser(page);

  const notice = page.getByRole("dialog", {
    name: "Property accountability only",
  });

  await expect(notice).toBeVisible();
  await expect(
    notice.getByText("not an official Army system of record"),
  ).toBeVisible();
  await expect(
    notice.getByText("Do not store classified information, PHI"),
  ).toBeVisible();
  await expect(
    notice.getByText("creating your first hand receipt"),
  ).toBeVisible();

  await notice.getByRole("button", { name: "I understand" }).click();
  await expect(notice).toBeHidden();

  await page.goto("/app/items");
  await expect(page.getByRole("heading", { name: "Items" })).toBeVisible();
  await page.goto("/app/dashboard");
  await expect(
    page.getByRole("dialog", { name: "Property accountability only" }),
  ).toBeHidden();
});
