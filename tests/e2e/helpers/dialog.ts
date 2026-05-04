import { expect, type Locator, type Page } from "@playwright/test";

export async function expectDialogContained(page: Page, dialog: Locator) {
  await expect(dialog).toBeVisible();

  const [box, viewport, scrollState] = await Promise.all([
    dialog.boundingBox(),
    page.viewportSize(),
    dialog.evaluate((element) => ({
      clientHeight: element.clientHeight,
      overflowY: getComputedStyle(element).overflowY,
      scrollHeight: element.scrollHeight,
    })),
  ]);

  expect(
    box,
    "dialog bounding box must be available before measuring containment",
  ).not.toBeNull();
  expect(box!.height).toBeLessThanOrEqual((viewport?.height ?? 0) - 16);

  if (scrollState.scrollHeight > scrollState.clientHeight) {
    expect(scrollState.overflowY).toMatch(/auto|scroll/);
  }
}
