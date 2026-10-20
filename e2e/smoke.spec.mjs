// Smoke tests. Tagged @smoke so the CD job can run them against the live site after a deploy.
import { test, expect } from './fixtures.mjs';

test.describe('smoke @smoke', () => {
  test('portfolio lists the four live products', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.card h3')).toHaveText(['Duely', 'Roamly', 'Tailor', 'Opportunity Hunter']);
  });

  test('Page Destroyer is listed with a working install link, its own page and a privacy policy', async ({ page, request }) => {
    await page.goto('/');
    const section = page.locator('#page-destroyer');
    await expect(section.locator('h3')).toHaveText('Page Destroyer');
    const install = section.locator('[data-chrome-link]');
    const href = await install.getAttribute('href');
    expect(href === '/page-destroyer/page-destroyer.zip' || href.startsWith('https://chromewebstore.google.com/')).toBe(true);
    if (!href.startsWith('https://')) expect((await request.get(href)).ok()).toBe(true);
    await section.locator('[data-destroy-here]').click();
    await expect(page.locator('[data-page-destroyer]')).toHaveCount(1);
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-page-destroyer]')).toHaveCount(0);
    for (const path of ['/page-destroyer/', '/page-destroyer/privacy/']) {
      const res = await page.goto(path);
      expect(res.ok()).toBe(true);
    }
    await expect(page.locator('h1')).toContainText('Privacy');
  });

  test('every project has a shareable link with a copy button', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/');
    const buttons = page.locator('.share-row [data-share-url]');
    await expect(buttons).toHaveCount(5);
    for (const url of await buttons.evaluateAll(els => els.map(e => e.dataset.shareUrl))) {
      expect(url).toMatch(/^https:\/\//);
    }
    const first = buttons.first();
    await first.click();
    await expect(first).toHaveText('Copied');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('https://heyduely.com/');
  });
});
