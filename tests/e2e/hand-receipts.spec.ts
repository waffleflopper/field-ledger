import { expect, type Page, test } from "@playwright/test";

async function signInLocalUser(page: Page) {
  const suffix = `${Date.now()}-${test.info().workerIndex}-${Math.random().toString(36).slice(2)}`;
  const email = `hand-receipts-${suffix}@example.test`;

  await page.goto("/auth/login?next=/app/hand-receipts");
  await page.getByRole("tab", { name: "Register" }).click();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/app\/hand-receipts$/);
  await page
    .getByRole("dialog", { name: "Property accountability only" })
    .getByRole("button", { name: "I understand" })
    .click();
}

test("users can create and see an active hand receipt on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signInLocalUser(page);

  await expect(
    page.getByRole("heading", { name: "Hand Receipts" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Start with one named hand receipt" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "New hand receipt" }).click();
  await page.getByLabel("Name").fill("HQ hand receipt");
  await page.getByLabel("Notes").fill("Primary sensitive items bucket.");
  await page.getByRole("button", { name: "Create" }).click();

  await expect(
    page.getByRole("heading", { name: "HQ hand receipt" }),
  ).toBeVisible();
  await expect(page.getByText("Primary sensitive items bucket.")).toBeVisible();
  await expect(page.getByText("Active", { exact: true })).toBeVisible();
});

test("hand receipt list uses desktop space without horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await signInLocalUser(page);

  await page.getByRole("button", { name: "New hand receipt" }).click();
  await page.getByLabel("Name").fill("Desktop review receipt");
  await page.getByRole("button", { name: "Create" }).click();

  await expect(
    page.getByRole("heading", { name: "Desktop review receipt" }),
  ).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(1280);
});

test("users can open and edit hand receipt details", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signInLocalUser(page);

  await page.getByRole("button", { name: "New hand receipt" }).click();
  await page.getByLabel("Name").fill("Detail edit receipt");
  await page.getByRole("button", { name: "Create" }).click();

  await page.getByRole("link", { name: "Open Detail edit receipt" }).click();
  await expect(page).toHaveURL(/\/app\/hand-receipts\/[0-9a-f-]+$/);
  await expect(
    page.getByRole("heading", { name: "Detail edit receipt" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Linked Items" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Edit details" }).click();
  await page
    .getByRole("textbox", { name: "Name", exact: true })
    .fill("Unsaved detail receipt");
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(
    page.getByRole("heading", { name: "Detail edit receipt" }),
  ).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Name", exact: true }),
  ).toBeHidden();

  await page.getByRole("button", { name: "Edit details" }).click();
  await page
    .getByRole("textbox", { name: "Name", exact: true })
    .fill("Updated detail receipt");
  await page.getByLabel("Hand receipt number").fill("HR-101");
  await page.getByLabel("Holder name").fill("SSG Rivera");
  await page.getByRole("button", { name: "Save changes" }).click();

  await expect(
    page.getByRole("heading", { name: "Updated detail receipt" }),
  ).toBeVisible();
  await expect(page.getByText("HR-101")).toBeVisible();
  await expect(page.getByText("SSG Rivera")).toBeVisible();
});
