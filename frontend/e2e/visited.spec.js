import { expect, test } from '@playwright/test';

test('loads map and search UI', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByPlaceholder('Search places in Ukraine')).toBeVisible();
  await expect(page.getByTestId('map-wrapper')).toBeVisible();
});

test('search suggestions appear', async ({ page }) => {
  await page.goto('/');
  await page.getByPlaceholder('Search places in Ukraine').fill('Kyiv');
  await expect(page.locator('.search-list')).toBeVisible();
});
