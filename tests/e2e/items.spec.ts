import { expect, type Page, test } from "@playwright/test";

async function signInLocalUser(page: Page) {
  const suffix = `${Date.now()}-${test.info().workerIndex}-${Math.random().toString(36).slice(2)}`;
  const email = `items-${suffix}@example.test`;

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

test("users can search items globally and open item detail on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signInLocalUser(page);

  await page.getByRole("button", { name: "New hand receipt" }).click();
  await page.getByLabel("Name").fill("Search receipt");
  await page.getByRole("button", { name: "Create" }).click();
  await page.getByRole("link", { name: "Open Search receipt" }).click();
  await page.waitForLoadState("networkidle");

  await page.getByRole("button", { name: "Add item" }).click();
  const createDialog = page.getByRole("dialog", {
    name: "Add property item",
  });
  await createDialog.getByLabel("Nomenclature").fill("Searchable radio");
  await createDialog.getByLabel("ECN").fill("ECN-SEARCH-1");
  await createDialog.getByLabel("Location").fill("Search cage");
  await createDialog.getByRole("button", { name: "Create Search cage" }).click();
  await createDialog.getByRole("button", { name: "Create item" }).click();
  await expect(
    page.getByRole("link", { name: "Open Searchable radio" }),
  ).toBeVisible();

  await page.goto("/app/items");
  await expect(page.getByRole("heading", { name: "Items" })).toBeVisible();
  await page.getByRole("searchbox", { name: "Search items" }).fill("search cage");

  await expect(
    page.getByRole("link", { name: "Open Searchable radio" }),
  ).toBeVisible();
  await expect(page.getByText("Search receipt")).toBeVisible();
  await expect(page.getByText("Matched Location")).toBeVisible();

  await page.getByRole("link", { name: "Open Searchable radio" }).click();
  await expect(page).toHaveURL(/\/app\/items\/[0-9a-f-]+$/);
  await expect(
    page.getByRole("heading", { name: "Searchable radio" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Hand Receipt Context" }),
  ).toBeVisible();
});

test("archived item records appear only when deliberately included", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await signInLocalUser(page);

  await page.getByRole("button", { name: "New hand receipt" }).click();
  await page.getByLabel("Name").fill("Archived search receipt");
  await page.getByRole("button", { name: "Create" }).click();
  await page
    .getByRole("link", { name: "Open Archived search receipt" })
    .click();
  await page.waitForLoadState("networkidle");

  await page.getByRole("button", { name: "Add item" }).click();
  const createDialog = page.getByRole("dialog", {
    name: "Add property item",
  });
  await createDialog.getByLabel("Nomenclature").fill("Archived search radio");
  await createDialog.getByLabel("ECN").fill("ECN-ARCHIVE-SEARCH");
  await createDialog.getByRole("button", { name: "Create item" }).click();
  await page.getByRole("link", { name: "Open Archived search radio" }).click();
  await page.getByRole("button", { name: "Archive item" }).click();
  await page
    .getByRole("dialog", { name: "Archive this item?" })
    .getByRole("button", { name: "Archive" })
    .click();
  await expect(page.getByText("archived property item")).toBeVisible();

  await page.goto("/app/items");
  await page
    .getByRole("searchbox", { name: "Search items" })
    .fill("ECN-ARCHIVE-SEARCH");
  await expect(
    page.getByRole("link", { name: "Open Archived search radio" }),
  ).toBeHidden();
  await page.getByLabel("Include archived item records").check();
  await expect(
    page.getByRole("link", { name: "Open Archived search radio" }),
  ).toBeVisible();
  await expect(page.getByText("Archived item")).toBeVisible();
});
