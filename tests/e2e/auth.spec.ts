import { expect, test } from "@playwright/test";

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

  expect(response.status()).toBe(307);
  expect(response.headers().location).toBe("http://localhost:3000/auth/login");
});
