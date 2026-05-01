import { expect, test } from "@playwright/test";

test("signed-in users can sign out from the app shell", async ({ page }) => {
  const suffix = `${Date.now()}-${test.info().workerIndex}-${Math.random().toString(36).slice(2)}`;
  const email = `signout-${suffix}@example.test`;

  await page.goto("/auth/login?next=/app/dashboard");
  await page.getByRole("tab", { name: "Register" }).click();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/app\/dashboard$/);

  await page
    .getByRole("dialog", { name: "Property accountability only" })
    .getByRole("button", { name: "I understand" })
    .click();
  await page.getByRole("button", { name: "Sign out" }).click();

  await expect(page).toHaveURL(/\/auth\/login$/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

test("signed-out users are redirected from the protected app area to sign-in", async ({
  page,
}) => {
  await page.goto("/app");

  await expect(page).toHaveURL(/\/auth\/login\?next=%2Fapp/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

test("sign-out returns the browser to the public auth surface", async ({
  request,
}) => {
  const response = await request.post("/auth/signout", {
    maxRedirects: 0,
  });

  expect(response.status()).toBe(303);
  const location = response.headers().location;
  expect(location).toBeTruthy();
  expect(new URL(location!, "http://localhost").pathname).toBe("/auth/login");
});
