import { expect, type Page, test } from "@playwright/test";

import { expectDialogContained } from "./helpers/dialog";

async function signInLocalUser(page: Page) {
  const suffix = `${Date.now()}-${test.info().workerIndex}-${Math.random().toString(36).slice(2)}`;
  const email = `responsive-${suffix}@example.test`;

  await page.goto("/auth/login?next=/app/dashboard");
  await page.getByRole("tab", { name: "Register" }).click();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await expect(
    page.getByRole("button", { name: "Create account" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/app\/dashboard$/);
  await page
    .getByRole("dialog", { name: "Property accountability only" })
    .getByRole("button", { name: "I understand" })
    .click();
}

async function expectNoHorizontalOverflow(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      ),
    )
    .toBeLessThanOrEqual(0);
}

test("tablet shell, item detail, and upload 2062 flow stay usable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await signInLocalUser(page);

  await expect(page.getByTestId("desktop-sidebar")).toBeVisible();
  await expect(page.getByTestId("mobile-bottom-nav")).toBeHidden();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.getByRole("link", { name: "Hand Receipts" }).click();
  await page.getByRole("button", { name: "New hand receipt" }).click();
  await page.getByLabel("Name").fill("Tablet smoke receipt");
  await page.getByRole("button", { name: "Create" }).click();
  await expect(
    page.getByRole("heading", { name: "Tablet smoke receipt" }),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.getByRole("link", { name: "Open Tablet smoke receipt" }).click();
  await page.getByRole("button", { name: "Add item" }).click();
  const createDialog = page.getByRole("dialog", {
    name: "Add property item",
  });
  await expectDialogContained(page, createDialog);
  await createDialog.getByLabel("Nomenclature").fill("Tablet smoke radio");
  await createDialog.getByLabel("ECN").fill("ECN-TABLET");
  await createDialog.getByRole("button", { name: "Create item" }).click();

  await page.getByRole("link", { name: "Open Tablet smoke radio" }).click();
  await expect(
    page.getByRole("heading", { name: "Tablet smoke radio" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Hand Receipt Context" }),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.getByRole("link", { name: "Back to hand receipt" }).click();
  await expect(page).toHaveURL(/\/app\/hand-receipts\/[0-9a-f-]+$/);
  await expect(
    page.getByRole("heading", { name: "Tablet smoke receipt" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Upload 2062" }).first().click();
  await expect(page).toHaveURL(
    /\/app\/hand-receipts\/[0-9a-f-]+\/upload-2062$/,
  );
  const stepRail = page.locator("ol").filter({ hasText: "Summary" });
  await expect(stepRail.getByText("Contact", { exact: true })).toBeVisible();
  await expect(stepRail.getByText("Document", { exact: true })).toBeVisible();
  await expect(stepRail.getByText("Items", { exact: true })).toBeVisible();
  await expect(stepRail.getByText("Summary", { exact: true })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});
