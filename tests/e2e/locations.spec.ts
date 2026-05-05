import { expect, type Page, test } from "@playwright/test";
import { eq } from "drizzle-orm";

import { accounts, authUser } from "@/db/schema";
import { getDrizzleClient } from "@/modules/provider-boundaries/database/drizzle";

async function signInLocalUser(page: Page) {
  const suffix = `${Date.now()}-${test.info().workerIndex}-${Math.random().toString(36).slice(2)}`;
  const email = `locations-${suffix}@example.test`;

  await page.goto("/auth/login?next=/app/locations");
  await page.getByRole("tab", { name: "Register" }).click();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await expect(
    page.getByRole("button", { name: "Create account" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/app\/locations$/);
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

test("users can create and review reusable locations", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signInLocalUser(page);

  await expect(
    page.getByRole("heading", { exact: true, name: "Locations" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "No reusable locations yet" }),
  ).toBeVisible();
  await expect(
    page.getByText("Keep location names plain. Do not store classified"),
  ).toBeVisible();

  await page.getByRole("button", { name: "New location" }).click();
  const dialog = page.getByRole("dialog", { name: "Create location" });
  await expect(dialog.getByText("Avoid classified information")).toBeVisible();
  await dialog.getByLabel("Name").fill("Arms room");
  await dialog.getByRole("button", { name: "Create" }).click();

  await expect(dialog).toBeHidden();
  await expect(page.getByRole("heading", { name: "Arms room" })).toBeVisible();
  await expect(page.getByText(/Added /)).toBeVisible();

  await page.getByRole("button", { name: "Edit Arms room" }).click();
  const editDialog = page.getByRole("dialog", { name: "Edit location" });
  await editDialog.getByLabel("Name").fill("Motor pool");
  await editDialog.getByRole("button", { name: "Save" }).click();

  await expect(editDialog).toBeHidden();
  await expect(page.getByRole("heading", { name: "Motor pool" })).toBeVisible();

  await page.getByRole("button", { name: "Archive Motor pool" }).click();
  const archiveDialog = page.getByRole("dialog", {
    name: "Archive location?",
  });
  await expect(
    archiveDialog.getByText("Existing item records keep their historical"),
  ).toBeVisible();
  await archiveDialog.getByRole("button", { name: "Archive" }).click();

  await expect(archiveDialog).toBeHidden();
  await expect(
    page.getByRole("heading", { name: "No reusable locations yet" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "New location" }).click();
  const recreateDialog = page.getByRole("dialog", { name: "Create location" });
  await recreateDialog.getByLabel("Name").fill("Motor pool");
  await recreateDialog.getByRole("button", { name: "Create" }).click();
  await expect(recreateDialog).toBeHidden();
  await expect(page.getByRole("heading", { name: "Motor pool" })).toBeVisible();
});

test("read-only users can review locations but cannot create them", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const { email } = await signInLocalUser(page);

  await page.getByRole("button", { name: "New location" }).click();
  await page
    .getByRole("dialog", { name: "Create location" })
    .getByLabel("Name")
    .fill("Motor pool");
  await page
    .getByRole("dialog", { name: "Create location" })
    .getByRole("button", { name: "Create" })
    .click();
  await expect(page.getByRole("heading", { name: "Motor pool" })).toBeVisible();

  await markAccountReadOnly(email);
  await page.reload();

  await expect(page.getByRole("heading", { name: "Motor pool" })).toBeVisible();
  await expect(
    page.getByText(
      "This account is read-only. Existing records remain available.",
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "New location" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Edit Motor pool" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Archive Motor pool" }),
  ).toBeDisabled();
});
