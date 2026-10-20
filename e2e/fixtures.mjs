// Shared fixtures for the portfolio tests.
// Every test fails if the page throws or logs a console error (font requests are stubbed).
import { test as base, expect } from '@playwright/test';

export const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    const errors = [];
    page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
    page.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
    await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ status: 200, contentType: r.request().url().includes('/css') ? 'text/css' : 'font/woff2', body: '' }));
    await use(page);
    if (!testInfo.annotations.some(a => a.type === 'allow-console-errors')) expect(errors, 'browser errors during the test').toEqual([]);
  },
});

export { expect };
