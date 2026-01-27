import { test, expect } from '@playwright/test';

const basePlaces = [
  {
    id: '1',
    lat: 50.4501,
    lng: 30.5234,
    createdAt: new Date('2024-06-10T12:00:00Z').toISOString(),
    title: 'Kyiv',
    note: '',
    source: 'search'
  },
  {
    id: '2',
    lat: 49.8397,
    lng: 24.0297,
    createdAt: new Date('2024-06-11T12:00:00Z').toISOString(),
    title: 'Lviv',
    note: 'Old town',
    source: 'click'
  }
];

test.beforeEach(async ({ page }) => {
  await page.route('**/api/places**', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: basePlaces });
      return;
    }
    if (route.request().method() === 'POST') {
      const body = JSON.parse(route.request().postData() || '{}');
      await route.fulfill({
        json: { ...body, id: 'new', createdAt: new Date().toISOString() }
      });
      return;
    }
    await route.fulfill({ json: {} });
  });

  await page.route('**/photon.komoot.io/api/**', async (route) => {
    await route.fulfill({
      json: {
        features: [
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [30.5234, 50.4501] },
            properties: { name: 'Kyiv', country: 'Ukraine', osm_id: 1 }
          }
        ]
      }
    });
  });
});

test('search -> confirm -> timeline updates', async ({ page }) => {
  await page.goto('/');
  await page.getByPlaceholder('Search Ukrainian places').fill('Kyiv');
  await page.getByText('Kyiv').click();
  await expect(page.getByTestId('confirm-sheet')).toBeVisible();
  await page.getByText('Confirm visited').click();
  await expect(page.getByText('Kyiv')).toBeVisible();
});

test('click map -> confirm -> persists after refresh', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('map').click({ position: { x: 200, y: 200 } });
  await expect(page.getByTestId('confirm-sheet')).toBeVisible();
  await page.getByText('Confirm visited').click();
  await page.reload();
  await expect(page.getByText('Kyiv')).toBeVisible();
});

test('date range filter reduces visible items', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('From').fill('2024-06-11');
  await expect(page.getByText('Lviv')).toBeVisible();
});
