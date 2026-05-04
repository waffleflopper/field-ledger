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
  await createRequirementDialog
    .getByRole("button", { name: "Add requirement" })
    .click();

  await expect(
    page.getByRole("heading", { name: "Monthly PMCS" }),
  ).toBeVisible();
  await expect(page.getByText("Monthly", { exact: true })).toBeVisible();

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

test("users can create single-item formal 2062 coverage from item detail", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signInLocalUser(page);

  await page.getByRole("button", { name: "New hand receipt" }).click();
  await page.getByLabel("Name").fill("2062 upload receipt");
  await page.getByRole("button", { name: "Create" }).click();
  await page.getByRole("link", { name: "Open 2062 upload receipt" }).click();

  await page.getByRole("button", { name: "Add item" }).click();
  const createItemDialog = page.getByRole("dialog", {
    name: "Add property item",
  });
  await createItemDialog.getByLabel("Nomenclature").fill("2062 test radio");
  await createItemDialog.getByLabel("ECN").fill("ECN-2062-UPLOAD");
  await createItemDialog.getByRole("button", { name: "Create item" }).click();
  await page.getByRole("link", { name: "Open 2062 test radio" }).click();

  await page.getByLabel("Contact name").fill("SPC Avery");
  await page.getByRole("button", { name: "Create SPC Avery" }).click();
  await expect(page.getByText("No 2062")).toBeVisible();

  await page.getByRole("link", { name: "Upload 2062" }).first().click();
  await expect(page).toHaveURL(/\/app\/items\/[0-9a-f-]+\/upload-2062$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Upload 2062" }),
  ).toBeVisible();
  await expect(page.getByText("2062 test radio")).toBeVisible();
  await expect(page.getByText("SPC Avery")).toBeVisible();

  await page.getByLabel("Upload 2062 document").setInputFiles({
    name: "signed-2062.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4\n% Field Ledger e2e fixture\n"),
  });
  await expect(
    page.getByText("signed-2062.pdf is saved as private document evidence."),
  ).toBeVisible();
  await page.getByLabel("Select document").selectOption({
    label: "signed-2062.pdf",
  });
  await page.getByRole("button", { name: "Create 2062" }).click();

  await expect(page).toHaveURL(/\/app\/items\/[0-9a-f-]+$/);
  await expect(
    page.getByRole("heading", { name: "2062 test radio" }),
  ).toBeVisible();
  await expect(page.getByText("DA Form 2062")).toBeVisible();
  await expect(page.getByText("SPC Avery")).toBeVisible();
  await expect(page.getByText("signed-2062.pdf")).toBeVisible();
  await expect(page.getByText("No 2062")).toBeHidden();
  await expect(page.getByText("Item linked to 2062")).toBeVisible();
});

test("item workflows warn and block around active 2062 coverage", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signInLocalUser(page);

  await page.getByRole("button", { name: "New hand receipt" }).click();
  await page.getByLabel("Name").fill("2062 source receipt");
  await page.getByRole("button", { name: "Create" }).click();
  await page.goto("/app/hand-receipts");
  await page.getByRole("button", { name: "New hand receipt" }).click();
  await page.getByLabel("Name").fill("2062 target receipt");
  await page.getByRole("button", { name: "Create" }).click();
  await page.goto("/app/hand-receipts");
  await page.getByRole("link", { name: "Open 2062 source receipt" }).click();

  await page.getByRole("button", { name: "Add item" }).click();
  const createItemDialog = page.getByRole("dialog", {
    name: "Add property item",
  });
  await createItemDialog.getByLabel("Nomenclature").fill("2062 blocked radio");
  await createItemDialog.getByLabel("ECN").fill("ECN-2062-BLOCK");
  await createItemDialog.getByRole("button", { name: "Create item" }).click();
  await page.getByRole("link", { name: "Open 2062 blocked radio" }).click();

  await page.getByLabel("Contact name").fill("SGT Morgan");
  await page.getByRole("button", { name: "Create SGT Morgan" }).click();
  await page.getByRole("link", { name: "Upload 2062" }).first().click();
  await page.getByLabel("Upload 2062 document").setInputFiles({
    name: "blocked-2062.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4\n% Field Ledger blocked 2062 fixture\n"),
  });
  await expect(
    page.getByText("blocked-2062.pdf is saved as private document evidence."),
  ).toBeVisible();
  await page.getByLabel("Select document").selectOption({
    label: "blocked-2062.pdf",
  });
  await page.getByRole("button", { name: "Create 2062" }).click();

  await page.getByRole("button", { name: "Move" }).click();
  const moveDialog = page.getByRole("dialog", { name: "Move item" });
  await expect(
    moveDialog.getByText("Move blocked by active 2062"),
  ).toBeVisible();
  await expect(
    moveDialog.getByText("Close this item's active 2062 link before moving"),
  ).toBeVisible();
  await expect(moveDialog.getByRole("button", { name: "Move" })).toBeDisabled();
  await moveDialog.getByRole("button", { name: "Cancel" }).click();

  await page.getByRole("button", { name: "Archive item" }).click();
  const archiveDialog = page.getByRole("dialog", {
    name: "Archive this item?",
  });
  await expect(
    archiveDialog.getByText("Archiving will close the active 2062 link"),
  ).toBeVisible();
  await expect(
    archiveDialog.getByText("The linked document and item history stay preserved."),
  ).toBeVisible();
  await expect(
    archiveDialog.getByText(
      "This is the last active item on the 2062, so the assignment will close.",
    ),
  ).toBeVisible();
  await archiveDialog
    .getByRole("button", { name: "Archive and close link" })
    .click();

  await expect(page.getByText("archived property item")).toBeVisible();
  await expect(page.getByText("Item archived")).toBeVisible();
  await expect(page.getByText("Item removed from 2062")).toBeVisible();
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
