// Smoke tests. Tagged @smoke so the CD job can run them against the live site after a deploy.
import { test, expect, STORAGE_KEY } from './fixtures.mjs';

test.describe('smoke @smoke', () => {
  test('portfolio lists Molbhav as the fifth product and links to the demo', async ({ page }) => {
    await page.goto('/');
    const titles = page.locator('.card h3');
    await expect(titles).toHaveCount(5);
    await expect(titles.nth(4)).toHaveText('Molbhav');
    await expect(page.locator('#molbhav-title ~ .card-actions .visit')).toHaveAttribute('href', './molbhav/');
    await expect(page.locator('body')).not.toContainText(/lathe/i);
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
    await expect(buttons).toHaveCount(6);
    for (const url of await buttons.evaluateAll(els => els.map(e => e.dataset.shareUrl))) {
      expect(url).toMatch(/^https:\/\//);
    }
    const first = buttons.first();
    await first.click();
    await expect(first).toHaveText('Copied');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('https://heyduely.com/');
  });

  test('demo loads with the live-demo banner and the scale logo', async ({ app, page }) => {
    await app.open({ fixedTime: false, hooks: false });
    await expect(page).toHaveTitle('Molbhav · live demo');
    await expect(page.locator('.banner.demo')).toContainText('Live demo');
    await expect(page.locator('.shell .prod')).toHaveText('Molbhav');
    await expect(page.locator('.demo-back')).toHaveAttribute('href', '/');
  });

  test('demo is dated to the visitor’s today', async ({ app, page }) => {
    await app.open({ fixedTime: false, hooks: false });
    const today = await page.evaluate(() => { const d = new Date(); return `${d.getDate()} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]} ${d.getFullYear()}`; });
    await expect(app.view()).toContainText(`as of ${today}`);
    const saved = await page.evaluate(k => JSON.parse(localStorage.getItem(k)), STORAGE_KEY);
    expect(Object.keys(saved.data.opps)).toHaveLength(16);
  });

  test('an AI preview runs end to end on an opportunity', async ({ app, page }) => {
    await app.open({ fixedTime: false, hooks: false });
    await app.go('opportunities');
    await app.openRecord('opp_sahyadri_pune');
    await page.locator('#drawer [data-act="aiReview"]').click();
    await expect(page.locator('#drawer .review')).toContainText(/Health [ABCD]/);
  });
});
