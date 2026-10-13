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
