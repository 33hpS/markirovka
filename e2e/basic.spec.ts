import { test, expect } from '@playwright/test';

test('Landing page shows title and technology badges', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveText(/Маркировочная|РњР°СЂРєРё/);
  await expect(page.getByText(/React 18/)).toBeVisible();
  await expect(page.getByText(/TypeScript/)).toBeVisible();
});
