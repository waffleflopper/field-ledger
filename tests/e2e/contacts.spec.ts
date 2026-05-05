import { expect, type Page, test } from "@playwright/test";
import { eq } from "drizzle-orm";

import { accounts, authUser } from "@/db/schema";
import { getDrizzleClient } from "@/modules/provider-boundaries/database/drizzle";

async function signInLocalUser(page: Page) {
  const suffix = `${Date.now()}-${test.info().workerIndex}-${Math.random().toString(36).slice(2)}`;
  const email = `contacts-${suffix}@example.test`;

  await page.goto("/auth/login?next=/app/contacts");
  await page.getByRole("tab", { name: "Register" }).click();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await expect(
    page.getByRole("button", { name: "Create account" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/app\/contacts$/);
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

test("users can create and review reusable contacts", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signInLocalUser(page);

  await expect(
    page.getByRole("heading", { exact: true, name: "Contacts" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "No reusable assignees yet" }),
  ).toBeVisible();
  await expect(
    page.getByText("Contacts are lightweight assignee names"),
  ).toBeVisible();

  await page.getByRole("button", { name: "New contact" }).click();
  const dialog = page.getByRole("dialog", { name: "Create contact" });
  await expect(dialog.getByText("Do not store PHI")).toBeVisible();
  await dialog.getByLabel("Display name").fill("SSG Rivera");
  await dialog.getByRole("button", { name: "Create" }).click();

  await expect(dialog).toBeHidden();
  await expect(page.getByRole("heading", { name: "SSG Rivera" })).toBeVisible();
  await expect(page.getByText(/Added /)).toBeVisible();

  await page.getByRole("button", { name: "Edit SSG Rivera" }).click();
  const editDialog = page.getByRole("dialog", { name: "Edit contact" });
  await editDialog.getByLabel("Display name").fill("SFC Rivera");
  await editDialog.getByRole("button", { name: "Save" }).click();

  await expect(editDialog).toBeHidden();
  await expect(page.getByRole("heading", { name: "SFC Rivera" })).toBeVisible();

  await page.getByRole("button", { name: "Archive SFC Rivera" }).click();
  const archiveDialog = page.getByRole("dialog", {
    name: "Archive contact?",
  });
  await expect(
    archiveDialog.getByText("Existing signed-to and 2062 history"),
  ).toBeVisible();
  await archiveDialog.getByRole("button", { name: "Archive" }).click();

  await expect(archiveDialog).toBeHidden();
  await expect(
    page.getByRole("heading", { name: "No reusable assignees yet" }),
  ).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(390);
});

test("read-only users can review contacts but cannot create them", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const { email } = await signInLocalUser(page);

  await page.getByRole("button", { name: "New contact" }).click();
  await page
    .getByRole("dialog", { name: "Create contact" })
    .getByLabel("Display name")
    .fill("CPL Nguyen");
  await page
    .getByRole("dialog", { name: "Create contact" })
    .getByRole("button", { name: "Create" })
    .click();
  await expect(page.getByRole("heading", { name: "CPL Nguyen" })).toBeVisible();

  await markAccountReadOnly(email);
  await page.reload();

  await expect(page.getByRole("heading", { name: "CPL Nguyen" })).toBeVisible();
  await expect(
    page.getByText(
      "This account is read-only. Existing records remain available.",
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "New contact" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Edit CPL Nguyen" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Archive CPL Nguyen" }),
  ).toBeDisabled();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(1280);
});
