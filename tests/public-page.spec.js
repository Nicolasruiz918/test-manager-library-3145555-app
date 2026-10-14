import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';

test('public presentation works independently at desktop and mobile sizes', async ({ page }) => {
  const errors = [];
  const requests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => requests.push(request.url()));
  await page.route('**/api/**', route => route.abort());
  mkdirSync('../test-manager-library-3145555-page/evidence/screenshots', { recursive: true });
  for (const [name, width, height] of [['desktop', 1440, 1000], ['mobile', 390, 844]]) {
    await page.setViewportSize({ width, height });
    await page.goto('http://localhost:8081');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Cada historia');
    await expect(page.getByRole('heading', { name: 'Encuentra la próxima lectura' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Entrar a mi biblioteca/ })).toHaveAttribute('href', 'https://localhost:8443');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `../test-manager-library-3145555-page/evidence/screenshots/${name}.png`, fullPage: true });
  }
  expect(requests.every(url => new URL(url).origin === 'http://localhost:8081')).toBe(true);
  expect(errors).toEqual([]);
});
