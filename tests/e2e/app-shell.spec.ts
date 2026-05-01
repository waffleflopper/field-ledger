import { expect, type Page, test } from "@playwright/test";

async function signInLocalUser(page: Page) {
  const suffix = `${Date.now()}-${test.info().workerIndex}-${Math.random().toString(36).slice(2)}`;
  const email = `shell-${suffix}@example.test`;

  await page.goto("/auth/login?next=/app/dashboard");
  await page.getByRole("tab", { name: "Register" }).click();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/app\/dashboard$/);
  await acknowledgeOnboardingIfPresent(page);
}

async function acknowledgeOnboardingIfPresent(page: Page) {
  const notice = page.getByRole("dialog", {
    name: "Property accountability only",
  });
  const acknowledgment = page.getByRole("button", { name: "I understand" });

  try {
    await expect(notice).toBeVisible({ timeout: 8_000 });
  } catch (error) {
    if (error instanceof Error && /timeout/i.test(error.message)) {
      return;
    }

    throw error;
  }

  await acknowledgment.click();
  await expect(notice).toBeHidden();
}

test("mobile shell uses bottom navigation and exposes More surfaces", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signInLocalUser(page);

  await expect(page.getByTestId("mobile-bottom-nav")).toBeVisible();
  await expect(page.getByTestId("desktop-sidebar")).toBeHidden();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  await page.getByRole("link", { name: /Items/ }).click();
  await expect(page).toHaveURL(/\/app\/items$/);
  await expect(page.getByRole("heading", { name: "Items" })).toBeVisible();

  await page.getByRole("button", { name: "More" }).click();
  await expect(page.getByRole("dialog", { name: "More" })).toBeVisible();
  await page.getByRole("link", { name: "Active 2062s" }).click();
  await expect(page).toHaveURL(/\/app\/active-2062s$/);
  await expect(
    page.getByRole("heading", { name: "Active 2062s" }),
  ).toBeVisible();
});

test("desktop shell uses a collapsible sidebar for app navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await signInLocalUser(page);

  await expect(page.getByTestId("desktop-sidebar")).toBeVisible();
  await expect(page.getByTestId("mobile-bottom-nav")).toBeHidden();

  await page.getByRole("link", { name: "Hand Receipts" }).click();
  await expect(page).toHaveURL(/\/app\/hand-receipts$/);
  await expect(
    page.getByRole("heading", { name: "Hand Receipts" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Toggle app sidebar" }).click();
  await expect(
    page.locator('[data-slot="sidebar"][data-state="collapsed"]'),
  ).toBeVisible();
  await expect(page.getByTestId("sidebar-brand")).toBeHidden();
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();

  const toggleBox = await page.getByTestId("sidebar-toggle").boundingBox();

  expect(toggleBox?.width).toBeLessThanOrEqual(36);
  await expect
    .poll(async () => {
      const signOutBox = await page
        .getByRole("button", { name: "Sign out" })
        .boundingBox();

      return signOutBox?.width ?? 0;
    })
    .toBeLessThanOrEqual(48);
});

test("signed-in users can open the Activity route empty state", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await signInLocalUser(page);

  await page.getByRole("link", { name: "Activity" }).click();

  await expect(page).toHaveURL(/\/app\/activity$/);
  await expect(
    page.getByRole("heading", { name: "Activity", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "No activity yet" }),
  ).toBeVisible();
  await expect(
    page.getByText("Events will appear here as you use Field Ledger."),
  ).toBeVisible();
});
