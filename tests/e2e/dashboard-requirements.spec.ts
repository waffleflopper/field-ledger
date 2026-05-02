import { expect, type Page, test } from "@playwright/test";

async function signInLocalUser(page: Page) {
  const suffix = `${Date.now()}-${test.info().workerIndex}-${Math.random().toString(36).slice(2)}`;
  const email = `dashboard-${suffix}@example.test`;

  await page.goto("/auth/login?next=/app/hand-receipts");
  await page.getByRole("tab", { name: "Register" }).click();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await expect(
    page.getByRole("button", { name: "Create account" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/app\/hand-receipts$/);
  const boundaryDialog = page.getByRole("dialog", {
    name: "Property accountability only",
  });
  await boundaryDialog.getByRole("button", { name: "I understand" }).click();
  await expect(boundaryDialog).toBeHidden();
}

async function createRequirement(
  page: Page,
  input: { name: string; nextDueDate: string },
) {
  await page.getByRole("button", { name: "Add requirement" }).click();
  const dialog = page.getByRole("dialog", { name: "Add requirement" });

  await dialog.getByLabel("Name").fill(input.name);
  await dialog.getByLabel("Interval").selectOption("monthly");
  await dialog.getByLabel("Next due date").fill(input.nextDueDate);
  await dialog.getByRole("button", { name: "Add requirement" }).click();
  await expect(page.getByRole("heading", { name: input.name })).toBeVisible();
}

function dateOnlyFromOffset(daysFromToday: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + daysFromToday);

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

test("dashboard shows requirement work in priority order on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signInLocalUser(page);

  await page.getByRole("button", { name: "New hand receipt" }).click();
  await page.getByLabel("Name").fill("Dashboard receipt");
  await page.getByRole("button", { name: "Create" }).click();
  await page.getByRole("link", { name: "Open Dashboard receipt" }).click();
  await page.getByRole("button", { name: "Add item" }).click();
  const itemDialog = page.getByRole("dialog", {
    name: "Add property item",
  });
  await itemDialog.getByLabel("Nomenclature").fill("Dashboard radio");
  await itemDialog.getByLabel("ECN").fill("DASH-RADIO-1");
  await itemDialog.getByRole("button", { name: "Create item" }).click();
  await page.getByRole("link", { name: "Open Dashboard radio" }).click();

  await createRequirement(page, {
    name: "Overdue PMCS",
    nextDueDate: dateOnlyFromOffset(-1),
  });
  await createRequirement(page, {
    name: "Due soon PMCS",
    nextDueDate: dateOnlyFromOffset(7),
  });
  await createRequirement(page, {
    name: "Upcoming PMCS",
    nextDueDate: dateOnlyFromOffset(20),
  });
  await createRequirement(page, {
    name: "Beyond window PMCS",
    nextDueDate: dateOnlyFromOffset(40),
  });

  await page.goto("/app/dashboard");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Overdue" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Due Soon" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Upcoming" })).toBeVisible();

  const overdue = page.getByRole("link").filter({ hasText: "Overdue PMCS" });
  await expect(overdue).toBeVisible();
  await expect(
    page.getByRole("link").filter({ hasText: "Due soon PMCS" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link").filter({ hasText: "Upcoming PMCS" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link").filter({ hasText: "Beyond window PMCS" }),
  ).toBeHidden();
  await expect(page.getByText("Dashboard receipt")).toHaveCount(3);

  const sectionOrder = await page
    .getByRole("heading", { name: /^(Overdue|Due Soon|Upcoming)$/ })
    .evaluateAll((headings) =>
      headings.map((heading) => heading.textContent?.trim()),
    );
  expect(sectionOrder).toEqual(["Overdue", "Due Soon", "Upcoming"]);

  await overdue.first().click();
  await expect(page).toHaveURL(/\/app\/items\/[0-9a-f-]+$/);
  await expect(
    page.getByRole("heading", { name: "Dashboard radio" }),
  ).toBeVisible();
});

test("dashboard requirements use desktop width without horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await signInLocalUser(page);

  await page.goto("/app/dashboard");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  const bodyWidth = await page.locator("body").evaluate((body) => {
    return {
      clientWidth: body.clientWidth,
      scrollWidth: body.scrollWidth,
    };
  });

  expect(bodyWidth.scrollWidth).toBeLessThanOrEqual(bodyWidth.clientWidth);
});
