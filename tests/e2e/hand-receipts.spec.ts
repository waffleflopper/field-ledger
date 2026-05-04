import { expect, type Page, test } from "@playwright/test";

async function signInLocalUser(page: Page) {
  const suffix = `${Date.now()}-${test.info().workerIndex}-${Math.random().toString(36).slice(2)}`;
  const email = `hand-receipts-${suffix}@example.test`;

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

async function expectHandReceiptDetail(page: Page, name: string) {
  await expect(page).toHaveURL(/\/app\/hand-receipts\/[0-9a-f-]+$/);
  await expect(page.getByRole("heading", { name })).toBeVisible();
}

function dateOnlyFromOffset(daysFromToday: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
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
  await expectHandReceiptDetail(page, "Item detail receipt");

  await page.getByRole("button", { name: "Add item" }).click();
  const createDialog = page.getByRole("dialog", {
    name: "Add property item",
  });
  await createDialog.getByLabel("Nomenclature").fill("M4 carbine");
  await createDialog.getByLabel("ECN").fill("ECN-101");
  await createDialog.getByLabel("Location").fill("Arms room");
  await createDialog.getByRole("button", { name: "Create Arms room" }).click();
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
    page.getByRole("heading", { name: "2062 Coverage" }),
  ).toBeVisible();
  await expect(page.getByText("Arms room")).toBeVisible();

  await page.getByRole("button", { name: "Edit item" }).click();
  await page.getByLabel("Nomenclature").fill("Updated M4 carbine");
  await page.getByLabel("Serial number").fill("SER-101");
  await page.getByLabel("Notes").fill("Rack 3");
  await page.getByRole("button", { name: "Clear" }).click();
  await page.getByLabel("Location").fill("Motor pool");
  await page.getByRole("button", { name: "Create Motor pool" }).click();
  await page.getByRole("button", { name: "Save changes" }).click();

  await expect(
    page.getByRole("heading", { name: "Updated M4 carbine" }),
  ).toBeVisible();
  await expect(page.getByText("SER-101")).toBeVisible();
  await expect(page.getByText("Rack 3")).toBeVisible();
  await expect(page.getByText("Motor pool")).toBeVisible();
  await expect(page.getByText("Item location changed")).toBeVisible();
  await expect(page.getByText("Item updated")).toBeVisible();
});

test("users can create multi-item formal 2062 coverage from hand receipt detail", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signInLocalUser(page);

  await page.getByRole("button", { name: "New hand receipt" }).click();
  await page.getByLabel("Name").fill("Multi 2062 receipt");
  await page.getByRole("button", { name: "Create" }).click();
  await page.getByRole("link", { name: "Open Multi 2062 receipt" }).click();
  await expectHandReceiptDetail(page, "Multi 2062 receipt");

  for (const [nomenclature, ecn] of [
    ["Multi radio", "ECN-MULTI-1"],
    ["Multi generator", "ECN-MULTI-2"],
    ["Multi closing kit", "ECN-MULTI-3"],
  ] as const) {
    await page.getByRole("button", { name: "Add item" }).click();
    const createDialog = page.getByRole("dialog", {
      name: "Add property item",
    });
    await createDialog.getByLabel("Nomenclature").fill(nomenclature);
    await createDialog.getByLabel("ECN").fill(ecn);
    await createDialog.getByRole("button", { name: "Create item" }).click();
    await expect(
      page.getByRole("link", { name: `Open ${nomenclature}` }),
    ).toBeVisible();
  }

  await page.getByRole("link", { name: "Upload 2062" }).click();
  await expect(page).toHaveURL(
    /\/app\/hand-receipts\/[0-9a-f-]+\/upload-2062$/,
  );
  await expect(
    page.getByRole("heading", { name: "Multi 2062 receipt" }),
  ).toBeVisible();

  await page.getByLabel("Contact name").fill("SPC Multi");
  await page.getByRole("button", { name: "Create SPC Multi" }).click();
  await page.getByRole("button", { name: "Continue to document" }).click();

  await page.getByLabel("Upload 2062 document").setInputFiles({
    name: "multi-2062.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4\n% Field Ledger multi 2062 fixture\n"),
  });
  await expect(
    page.getByText("multi-2062.pdf is saved as private document evidence."),
  ).toBeVisible();
  await page.getByLabel("Select document").selectOption({
    label: "multi-2062.pdf",
  });
  await page.getByRole("button", { name: "Continue to items" }).click();

  await page.getByLabel("Narrow items").fill("multi");
  await page.getByLabel("Multi radio").check();
  await page.getByLabel("Multi generator").check();
  await page.getByRole("button", { name: "Review 2 items" }).click();

  await expect(page.getByText("2 selected")).toBeVisible();
  await expect(page.getByText("SPC Multi")).toBeVisible();
  await expect(page.getByText("multi-2062.pdf")).toBeVisible();
  await page.getByRole("button", { name: "Create assignment" }).click();

  await expect(page).toHaveURL(/\/app\/hand-receipts\/[0-9a-f-]+$/);
  await expect(page.getByText("DA Form 2062")).toHaveCount(2);
  await expect(page.getByText("SPC Multi")).toHaveCount(3);
  await expect(page.getByText("2 items covered")).toBeVisible();

  await page
    .getByRole("button", { name: "Remove Multi radio from 2062" })
    .click();
  const removeDialog = page.getByRole("dialog", {
    name: "Remove item from 2062?",
  });
  await removeDialog.getByLabel("Remove date").fill(dateOnlyFromOffset(1));
  await expect(
    removeDialog.getByText("Remove date cannot be in the future."),
  ).toBeVisible();
  await removeDialog.getByLabel("Remove date").fill(dateOnlyFromOffset(-1));
  await removeDialog.getByRole("button", { name: "Remove item" }).click();
  await expect(page.getByText("1 item covered")).toBeVisible();
  await expect(page.getByText("Item removed from 2062")).toBeVisible();

  await page.getByRole("button", { name: "Close" }).click();
  const closeDialog = page.getByRole("dialog", {
    name: "Close this 2062 assignment?",
  });
  const closeDateInput = closeDialog.getByLabel("Close date");
  await expect(closeDateInput).toHaveValue(
    (await closeDateInput.getAttribute("max")) ?? "",
  );
  await closeDateInput.fill(dateOnlyFromOffset(-1));
  await closeDialog.getByRole("button", { name: "Close assignment" }).click();
  await expect(
    page.getByText("No active 2062 assignments for this hand receipt."),
  ).toBeVisible();
  await expect(page.getByText("2062 assignment closed")).toBeVisible();

  await page.getByRole("link", { name: "Upload 2062" }).click();
  await page.getByLabel("Contact name").fill("SPC Last");
  await page.getByRole("button", { name: "Create SPC Last" }).click();
  await page.getByRole("button", { name: "Continue to document" }).click();
  await page.getByLabel("Select document").selectOption({
    label: "multi-2062.pdf",
  });
  await page.getByRole("button", { name: "Continue to items" }).click();
  await page.getByLabel("Narrow items").fill("closing");
  await page.getByLabel("Multi closing kit").check();
  await page.getByRole("button", { name: "Review 1 item" }).click();
  await page.getByRole("button", { name: "Create assignment" }).click();
  await expect(page.getByText("1 item covered")).toBeVisible();
  await page
    .getByRole("button", { name: "Remove Multi closing kit from 2062" })
    .click();
  const finalRemoveDialog = page.getByRole("dialog", {
    name: "Remove item from 2062?",
  });
  await expect(
    finalRemoveDialog.getByText(
      "This is the last active item, so the assignment will close too.",
    ),
  ).toBeVisible();
  await finalRemoveDialog.getByRole("button", { name: "Remove item" }).click();
  await expect(
    page.getByText("No active 2062 assignments for this hand receipt."),
  ).toBeVisible();

  await page.goto("/app/active-2062s");
  await expect(
    page.getByRole("heading", { name: "Active 2062s" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "No active 2062s" }),
  ).toBeVisible();
});

test("hand receipt upload 2062 flow uses desktop width without horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await signInLocalUser(page);

  await page.getByRole("button", { name: "New hand receipt" }).click();
  await page.getByLabel("Name").fill("Desktop upload 2062 receipt");
  await page.getByRole("button", { name: "Create" }).click();
  await page
    .getByRole("link", { name: "Open Desktop upload 2062 receipt" })
    .click();
  await expectHandReceiptDetail(page, "Desktop upload 2062 receipt");

  await page.getByRole("link", { name: "Upload 2062" }).click();
  await expect(
    page.getByRole("heading", { name: "Desktop upload 2062 receipt" }),
  ).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(1280);
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
  await expectHandReceiptDetail(page, "Item lifecycle receipt");

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

test("users can move an item between active hand receipts", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signInLocalUser(page);

  await page.getByRole("button", { name: "New hand receipt" }).click();
  await page.getByLabel("Name").fill("Source move receipt");
  await page.getByRole("button", { name: "Create" }).click();
  await page.getByRole("button", { name: "New hand receipt" }).click();
  await page.getByLabel("Name").fill("Target move receipt");
  await page.getByRole("button", { name: "Create" }).click();

  await page.getByRole("link", { name: "Open Source move receipt" }).click();
  await expectHandReceiptDetail(page, "Source move receipt");
  await page.getByRole("button", { name: "Add item" }).click();
  const createDialog = page.getByRole("dialog", {
    name: "Add property item",
  });
  await createDialog.getByLabel("Nomenclature").fill("Move test radio");
  await createDialog.getByLabel("ECN").fill("ECN-MOVE");
  await createDialog.getByRole("button", { name: "Create item" }).click();

  await page.getByRole("link", { name: "Open Move test radio" }).click();
  await page.getByRole("button", { name: "Move" }).click();
  const moveDialog = page.getByRole("dialog", { name: "Move item" });
  await moveDialog
    .getByLabel("Target hand receipt")
    .selectOption({ label: "Target move receipt" });
  await moveDialog.getByRole("button", { name: "Move" }).click();

  await expect(
    page.getByRole("link", { name: "Target move receipt" }),
  ).toBeVisible();
  await expect(page.getByText("Item moved")).toBeVisible();

  await page.getByRole("link", { name: "Back to hand receipt" }).click();
  await expect(
    page.getByRole("heading", { name: "Target move receipt" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Open Move test radio" }),
  ).toBeVisible();
});

test("users can assign and clear manual signed-to state without a 2062", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signInLocalUser(page);

  await page.getByRole("button", { name: "New hand receipt" }).click();
  await page.getByLabel("Name").fill("Signed-to receipt");
  await page.getByRole("button", { name: "Create" }).click();
  await page.getByRole("link", { name: "Open Signed-to receipt" }).click();
  await expectHandReceiptDetail(page, "Signed-to receipt");

  await page.getByRole("button", { name: "Add item" }).click();
  const createDialog = page.getByRole("dialog", {
    name: "Add property item",
  });
  await createDialog.getByLabel("Nomenclature").fill("Signed-to radio");
  await createDialog.getByLabel("ECN").fill("ECN-SIGNED");
  await createDialog.getByRole("button", { name: "Create item" }).click();

  await page.getByRole("link", { name: "Open Signed-to radio" }).click();
  await expect(page.getByRole("heading", { name: "Signed to" })).toBeVisible();
  await expect(page.getByText("Not signed out.")).toBeVisible();

  await page.getByLabel("Contact name").fill("SSG Rivera");
  await page.getByRole("button", { name: "Create SSG Rivera" }).click();

  await expect(
    page.getByRole("paragraph").filter({ hasText: "SSG Rivera" }),
  ).toBeVisible();
  await expect(page.getByText("No 2062")).toBeVisible();
  await expect(page.getByText("Item signed to contact")).toBeVisible();

  await page.getByRole("button", { name: "Clear" }).click();

  await expect(page.getByText("Not signed out.")).toBeVisible();
  await expect(page.getByText("Item signed-to cleared")).toBeVisible();
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
  await expectHandReceiptDetail(page, "Activity context receipt");

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
  await expectHandReceiptDetail(page, "Lifecycle receipt");

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
    page.getByRole("heading", { name: "Hand Receipts" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Open Lifecycle receipt" }),
  ).toBeHidden();

  const archivedTab = page.getByRole("link", { name: "Archived" });
  await archivedTab.click();
  await expect(archivedTab).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("link", { name: "Open Lifecycle receipt" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Restore" }).click();
  await page.getByRole("link", { name: "Active" }).click();
  await expect(
    page.getByRole("link", { name: "Open Lifecycle receipt" }),
  ).toBeVisible();
});
