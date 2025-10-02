import { test, expect } from '@playwright/test';

test('Landing page shows title and technology badges', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveText(/Маркировочная/);
  await expect(page.getByText(/React 18/)).toBeVisible();
  await expect(page.getByText(/TypeScript/)).toBeVisible();
});

test('Navigation to main sections', async ({ page }) => {
  const routes: { path: string; re: RegExp }[] = [
    { path: '/production', re: /Производство/ },
    { path: '/designer', re: /Дизайнер/ },
    { path: '/labels', re: /Этикетки/ },
    { path: '/printing', re: /Печать/ },
    { path: '/reports', re: /Отчётность/ },
    { path: '/users', re: /Пользователи/ },
  ];
  for (const r of routes) {
    await page.goto(r.path);
    await expect(page.locator('h1')).toHaveText(r.re);
  }
});
