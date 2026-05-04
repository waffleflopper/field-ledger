import { expect, type Page, test } from "@playwright/test";
import { eq } from "drizzle-orm";

import { accounts, authUser } from "@/db/schema";
import { getDrizzleClient } from "@/modules/provider-boundaries/database/drizzle";

async function signInLocalUser(page: Page) {
  const suffix = `${Date.now()}-${test.info().workerIndex}-${Math.random().toString(36).slice(2)}`;
  const email = `blocked-${suffix}@example.test`;

  await page.goto("/auth/login?next=/app/hand-receipts");
  await page.getByRole("tab", { name: "Register" }).click();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await expect(
    page.getByRole("button", { name: "Create account" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/app\/hand-receipts$/);
  const notice = page.getByRole("dialog", {
    name: "Property accountability only",
  });
  await notice.getByRole("button", { name: "I understand" }).click();
  await expect(notice).toBeHidden();

  return { email };
}

async function markAccountReadOnly(email: string) {
  const db = getDrizzleClient();
  const [user] = await db
    .select({ id: authUser.id })
    .from(authUser)
    .where(eq(authUser.email, email));

  if (!user) {
    throw new Error(`Test user ${email} was not created.`);
  }

  await db
    .update(accounts)
    .set({
      accessState: "paused_read_only",
      updatedAt: new Date(),
    })
    .where(eq(accounts.userId, user.id));
}

test("read-only hand receipt detail explains blocked writes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const { email } = await signInLocalUser(page);

  await page.getByRole("button", { name: "New hand receipt" }).click();
  await page.getByLabel("Name").fill("Read-only receipt");
  await page.getByRole("button", { name: "Create" }).click();
  await page.getByRole("link", { name: "Open Read-only receipt" }).click();
  await expect(page).toHaveURL(/\/app\/hand-receipts\/[0-9a-f-]+$/);
  await expect(
    page.getByRole("heading", { name: "Read-only receipt" }),
  ).toBeVisible();

  await markAccountReadOnly(email);
  await page.reload();

  await expect(
    page.getByText(
      "Detail records remain available, but edits and lifecycle changes are paused until access is restored.",
    ),
  ).toBeVisible();
  const addItemButton = page.getByRole("button", { name: "Add item" });
  await expect(addItemButton).toBeDisabled();
  await expect(addItemButton).toHaveAttribute(
    "title",
    "This account is read-only. Existing records remain available.",
  );
});

test("item create validation errors render inline and clear after resubmission", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signInLocalUser(page);

  await page.getByRole("button", { name: "New hand receipt" }).click();
  await page.getByLabel("Name").fill("Validation receipt");
  await page.getByRole("button", { name: "Create" }).click();
  await page.getByRole("link", { name: "Open Validation receipt" }).click();
  await page.getByRole("button", { name: "Add item" }).click();

  const dialog = page.getByRole("dialog", { name: "Add property item" });
  await dialog.getByLabel("Nomenclature").fill("Validation radio");
  await dialog.getByRole("button", { name: "Create item" }).click();
  await expect(
    dialog.getByText(
      "Add an ECN, serial number, or generated Field Ledger ID.",
    ),
  ).toBeVisible();

  await dialog.getByLabel("ECN").fill("ECN-VALIDATION");
  await dialog.getByRole("button", { name: "Create item" }).click();

  await expect(dialog).toBeHidden();
  await expect(
    page.getByRole("link", { name: "Open Validation radio" }),
  ).toBeVisible();
});

test("empty states describe active 2062 and requirement state", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signInLocalUser(page);

  await page.goto("/app/active-2062s");
  await expect(
    page.getByRole("heading", { name: "No active 2062s" }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Formal 2062 assignments will appear here after you upload a private document and link it to property.",
    ),
  ).toBeVisible();

  await page.goto("/app/hand-receipts");
  await page.getByRole("button", { name: "New hand receipt" }).click();
  await page.getByLabel("Name").fill("Empty state receipt");
  await page.getByRole("button", { name: "Create" }).click();
  await page.getByRole("link", { name: "Open Empty state receipt" }).click();
  await page.getByRole("button", { name: "Add item" }).click();

  const dialog = page.getByRole("dialog", { name: "Add property item" });
  await dialog.getByLabel("Nomenclature").fill("Empty state radio");
  await dialog.getByLabel("ECN").fill("ECN-EMPTY");
  await dialog.getByRole("button", { name: "Create item" }).click();
  await page.getByRole("link", { name: "Open Empty state radio" }).click();

  await expect(
    page.getByRole("heading", { name: "No active requirements" }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Add the first recurring obligation for this item when there is a maintenance, inspection, calibration, or replacement cadence to track.",
    ),
  ).toBeVisible();
});
