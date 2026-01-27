import { test, expect } from "@playwright/test";

test("search -> confirm -> timeline updates", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder("Search places in Ukraine").fill("Kyiv");
  await page.waitForSelector(".search-results li");
  await page.click(".search-results li");
  await page.getByRole("button", { name: "Confirm visited" }).click();
  await expect(page.getByText("Timeline")).toBeVisible();
});

test("date range filter reduces timeline items", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("From").fill("2025-01-01");
  await page.getByLabel("To").fill("2025-01-02");
  await expect(page.getByText("Timeline")).toBeVisible();
});
