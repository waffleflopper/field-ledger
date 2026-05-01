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
    page.getByRole("heading", { name: "Property Items" }),
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

test("users can open and edit item details from a hand receipt", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signInLocalUser(page);

  await page.getByRole("button", { name: "New hand receipt" }).click();
  await page.getByLabel("Name").fill("Item detail receipt");
  await page.getByRole("button", { name: "Create" }).click();
  await page.getByRole("link", { name: "Open Item detail receipt" }).click();
  await page.waitForLoadState("networkidle");

  await page.getByRole("button", { name: "Add item" }).click();
  const createDialog = page.getByRole("dialog", {
    name: "Add property item",
  });
  await createDialog.getByLabel("Nomenclature").fill("M4 carbine");
  await createDialog.getByLabel("ECN").fill("ECN-101");
  await createDialog.getByRole("button", { name: "Create item" }).click();

  await page.getByRole("link", { name: "Open M4 carbine" }).click();
  await expect(page).toHaveURL(
    /\/app\/hand-receipts\/[0-9a-f-]+\/items\/[0-9a-f-]+$/,
  );
  await expect(page.getByRole("heading", { name: "M4 carbine" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Hand Receipt Context" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Item detail receipt" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Requirements" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Active 2062s" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Edit item" }).click();
  await page.getByLabel("Nomenclature").fill("Updated M4 carbine");
  await page.getByLabel("Serial number").fill("SER-101");
  await page.getByLabel("Notes").fill("Rack 3");
  await page.getByRole("button", { name: "Save changes" }).click();

  await expect(
    page.getByRole("heading", { name: "Updated M4 carbine" }),
  ).toBeVisible();
  await expect(page.getByText("SER-101")).toBeVisible();
  await expect(page.getByText("Rack 3")).toBeVisible();
  await expect(page.getByText("Item updated")).toBeVisible();
});

test("users can archive, review, and restore property items", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signInLocalUser(page);

  await page.getByRole("button", { name: "New hand receipt" }).click();
  await page.getByLabel("Name").fill("Item lifecycle receipt");
  await page.getByRole("button", { name: "Create" }).click();
  await page.getByRole("link", { name: "Open Item lifecycle receipt" }).click();
  await page.waitForLoadState("networkidle");

  await page.getByRole("button", { name: "Add item" }).click();
  const createDialog = page.getByRole("dialog", {
    name: "Add property item",
  });
  await createDialog.getByLabel("Nomenclature").fill("PRC radio");
  await createDialog.getByLabel("ECN").fill("ECN-404");
  await createDialog.getByRole("button", { name: "Create item" }).click();

  await page.getByRole("link", { name: "Open PRC radio" }).click();
  await expect(page).toHaveURL(
    /\/app\/hand-receipts\/[0-9a-f-]+\/items\/[0-9a-f-]+$/,
  );
  await expect(page.getByText(/will leave active hand receipt/)).toBeHidden();
  await page.getByRole("button", { name: "Archive item" }).click();
  const archiveDialog = page.getByRole("dialog", {
    name: "Archive this item?",
  });
  await expect(
    archiveDialog.getByText(/will leave active hand receipt/),
  ).toBeVisible();
  await archiveDialog.getByRole("button", { name: "Archive" }).click();

  await expect(page.getByText("archived property item")).toBeVisible();
  await expect(page.getByText("Item archived")).toBeVisible();
  await page.getByRole("link", { name: "Back to hand receipt" }).click();
  await expect(page.getByRole("link", { name: "Open PRC radio" })).toBeHidden();

  await page.getByRole("button", { name: "Archived" }).click();
  await expect(
    page.getByRole("link", { name: "Open PRC radio" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Restore" }).click();
  await page.getByRole("button", { name: "Active" }).click();
  await expect(
    page.getByRole("link", { name: "Open PRC radio" }),
  ).toBeVisible();
});

test("hand receipt activity appears in detail, dashboard, and Activity route", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signInLocalUser(page);

  await page.getByRole("button", { name: "New hand receipt" }).click();
  await page.getByLabel("Name").fill("Activity context receipt");
  await page.getByRole("button", { name: "Create" }).click();
  await page
    .getByRole("link", { name: "Open Activity context receipt" })
    .click();
  await page.waitForLoadState("networkidle");

  await expect(
    page.getByRole("heading", { name: "Recent Activity" }),
  ).toBeVisible();
  await expect(page.getByText("Hand receipt created")).toBeVisible();
  await expect(page.getByText("hand_receipt.created")).toBeHidden();

  await page.goto("/app/dashboard");
  await expect(
    page.getByRole("heading", { name: "Recent Activity" }),
  ).toBeVisible();
  await expect(page.getByText("Hand receipt created")).toBeVisible();
  await expect(page.getByText("Activity context receipt")).toBeVisible();

  await page.goto("/app/activity");
  await expect(page.getByRole("heading", { name: "Activity" })).toBeVisible();
  await expect(page.getByText("Hand receipt created")).toBeVisible();
  await expect(page.getByText("Activity context receipt")).toBeVisible();
  await expect(page.getByText("hand_receipt.created")).toBeHidden();
});

test("users can archive, review, and restore a hand receipt", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signInLocalUser(page);

  await page.getByRole("button", { name: "New hand receipt" }).click();
  await page.getByLabel("Name").fill("Lifecycle receipt");
  await page.getByRole("button", { name: "Create" }).click();
  await page.getByRole("link", { name: "Open Lifecycle receipt" }).click();
  await page.waitForLoadState("networkidle");

  await expect(page.getByText(/will leave active workflows/)).toBeHidden();
  await page.getByRole("button", { name: "Archive hand receipt" }).click();
  const archiveDialog = page.getByRole("dialog", {
    name: "Archive this hand receipt?",
  });
  await expect(
    archiveDialog.getByText(/will leave active workflows/),
  ).toBeVisible();
  await archiveDialog.getByRole("button", { name: "Archive" }).click();

  await expect(page.getByText("archived receipt")).toBeVisible();
  await page.getByRole("link", { name: "Hand Receipts" }).first().click();
  await expect(
    page.getByRole("link", { name: "Open Lifecycle receipt" }),
  ).toBeHidden();

  await page.getByRole("button", { name: "Archived" }).click();
  await expect(
    page.getByRole("link", { name: "Open Lifecycle receipt" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Restore" }).click();
  await page.getByRole("button", { name: "Active" }).click();
  await expect(
    page.getByRole("link", { name: "Open Lifecycle receipt" }),
  ).toBeVisible();
});
