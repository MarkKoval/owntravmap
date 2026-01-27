import { test, expect } from "@playwright/test";

test("search and confirm adds to timeline", async ({ page }) => {
  await page.goto("/");
  const search = page.getByPlaceholder("Search Ukraine");
  await search.fill("Kyiv");
  await page.waitForTimeout(800);
  const first = page.locator(".search-results li").first();
  await first.click();
  await page.getByText("Confirm visited").click();
  await expect(page.locator(".timeline-item")).toHaveCount(1);
});

test("click map to add place", async ({ page }) => {
  await page.goto("/");
  const canvas = page.locator(".map canvas");
  await canvas.click({ position: { x: 200, y: 200 } });
  await page.getByText("Confirm visited").click();
  await expect(page.locator(".timeline-item")).toHaveCount(1);
});

test("date range filter reduces items", async ({ page }) => {
  await page.goto("/");
  const canvas = page.locator(".map canvas");
  await canvas.click({ position: { x: 200, y: 200 } });
  await page.getByText("Confirm visited").click();
  await page.getByText("All").click();
  await expect(page.locator(".timeline-item")).toHaveCount(1);
});
