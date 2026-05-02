import { expect, type Page, test } from "@playwright/test";

async function signInLocalUser(page: Page) {
  const suffix = `${Date.now()}-${test.info().workerIndex}-${Math.random().toString(36).slice(2)}`;
  const email = `items-${suffix}@example.test`;

  await page.goto("/auth/login?next=/app/hand-receipts");
  await page.getByRole("tab", { name: "Register" }).click();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await expect(
    page.getByRole("button", { name: "Create account" }),
  ).toBeEnabled();
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
  await expect(
    page.getByRole("heading", { name: "Search receipt" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Add item" }).click();
  const createDialog = page.getByRole("dialog", {
    name: "Add property item",
  });
  await createDialog.getByLabel("Nomenclature").fill("Searchable radio");
  await createDialog.getByLabel("ECN").fill("ECN-SEARCH-1");
  await createDialog.getByLabel("Location").fill("Search cage");
  await createDialog
    .getByRole("button", { name: "Create Search cage" })
    .click();
  await createDialog.getByRole("button", { name: "Create item" }).click();
  await expect(
    page.getByRole("link", { name: "Open Searchable radio" }),
  ).toBeVisible();

  await page.goto("/app/items");
  await expect(page.getByRole("heading", { name: "Items" })).toBeVisible();
  await page
    .getByRole("searchbox", { name: "Search items" })
    .fill("search cage");

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

test("users can create and see an item requirement from item detail", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signInLocalUser(page);

  await page.getByRole("button", { name: "New hand receipt" }).click();
  await page.getByLabel("Name").fill("Requirement receipt");
  await page.getByRole("button", { name: "Create" }).click();
  await page.getByRole("link", { name: "Open Requirement receipt" }).click();

  await page.getByRole("button", { name: "Add item" }).click();
  const createItemDialog = page.getByRole("dialog", {
    name: "Add property item",
  });
  await createItemDialog.getByLabel("Nomenclature").fill("Requirement radio");
  await createItemDialog.getByLabel("ECN").fill("REQ-RADIO-1");
  await createItemDialog.getByRole("button", { name: "Create item" }).click();
  await page.getByRole("link", { name: "Open Requirement radio" }).click();

  await expect(
    page.getByRole("heading", { name: "Requirements" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Add requirement" }).click();
  const createRequirementDialog = page.getByRole("dialog", {
    name: "Add requirement",
  });
  await createRequirementDialog.getByLabel("Name").fill("Monthly PMCS");
  await createRequirementDialog.getByLabel("Interval").selectOption("monthly");
  await createRequirementDialog.getByLabel("Next due date").fill("2026-06-15");
  await createRequirementDialog
    .getByRole("button", { name: "Add requirement" })
    .click();

  await expect(
    page.getByRole("heading", { name: "Monthly PMCS" }),
  ).toBeVisible();
  await expect(page.getByText("Monthly", { exact: true })).toBeVisible();
  await expect(page.getByText("Due Jun 15, 2026")).toBeVisible();

  await page.getByRole("button", { name: "Complete" }).click();
  const completionDialog = page.getByRole("dialog", {
    name: "Complete requirement",
  });
  await completionDialog.getByLabel("Completion date").fill("2026-01-15");
  await completionDialog.getByLabel("Notes").fill("PMCS annotated in binder.");
  await completionDialog
    .getByRole("button", { name: "Record completion" })
    .click();

  await expect(page.getByText("Due Feb 15, 2026")).toBeVisible();
  await expect(page.getByText("Recent completions")).toBeVisible();
  await expect(page.getByText("Jan 15, 2026")).toBeVisible();
  await expect(page.getByText("PMCS annotated in binder.")).toBeVisible();

  await page.getByRole("button", { name: "Edit Monthly PMCS" }).click();
  const editRequirementDialog = page.getByRole("dialog", {
    name: "Edit requirement",
  });
  await editRequirementDialog.getByLabel("Name").fill("Quarterly radio PMCS");
  await editRequirementDialog.getByLabel("Notes").fill("Check antenna kit.");
  await editRequirementDialog.getByLabel("Interval").selectOption("quarterly");
  await editRequirementDialog
    .getByRole("button", { name: "Save changes" })
    .click();

  await expect(
    page.getByRole("heading", { name: "Quarterly radio PMCS" }),
  ).toBeVisible();
  await expect(page.getByText("Check antenna kit.")).toBeVisible();
  await expect(page.getByText("Quarterly", { exact: true })).toBeVisible();
  await expect(page.getByText("Due Apr 15, 2026")).toBeVisible();
  await expect(page.getByText("Jan 15, 2026")).toBeVisible();
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
  await expect(
    page.getByRole("heading", { name: "Archived search receipt" }),
  ).toBeVisible();

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
  await expect(page.getByText("Archived item", { exact: true })).toBeVisible();
});
