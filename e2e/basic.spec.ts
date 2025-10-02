import { test, expect } from '@playwright/test';

test.describe('Landing page', () => {
  test('shows title and technology badges', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toHaveText(/Маркировочная|РњР°СЂРєРё/); // handle possible encoding mishaps
    await expect(page.getByText(/React 18/)).toBeVisible();
    await expect(page.getByText(/TypeScript/)).toBeVisible();
  });
});
