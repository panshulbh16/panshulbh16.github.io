// Smoke tests. Tagged @smoke so the CD job can run them against the live site after a deploy.
import { test, expect } from './fixtures.mjs';

const PROJECTS = ['Duely', 'Roamly', 'Opportunity Hunter', 'Tailor', 'Page Destroyer'];

test.describe('smoke @smoke', () => {
  test('profile shows who I am, where I work and what I built', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toHaveText('Panshul Bharadwaj');
    for (const heading of ['About', 'Work Experience', 'Education', 'Skills', 'Get in touch']) {
      await expect(page.getByRole('heading', { name: heading })).toBeVisible();
    }
    await expect(page.locator('#work')).toContainText('Deloitte USI');
    await expect(page.locator('#work')).toContainText('SoftClouds');
    await expect(page.locator('#projects h3')).toHaveText(PROJECTS);

    // Work entries open to show what the job was.
    await page.locator('#work').getByText('Deloitte USI').click();
    await expect(page.locator('#work')).toContainText('Oracle Cloud Redwood');
  });

  test('Page Destroyer has a working install link, its own page and a privacy policy', async ({ page, request }) => {
    await page.goto('/');
    const install = page.locator('[data-chrome-link]');
    const href = await install.getAttribute('href');
    expect(href === '/page-destroyer/page-destroyer.zip' || href.startsWith('https://chromewebstore.google.com/')).toBe(true);
    if (!href.startsWith('https://')) expect((await request.get(href)).ok()).toBe(true);

    await page.locator('[data-destroy-here]').click();
    await expect(page.locator('[data-page-destroyer]')).toHaveCount(1);
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-page-destroyer]')).toHaveCount(0);

    for (const path of ['/page-destroyer/', '/page-destroyer/privacy/']) {
      const res = await page.goto(path);
      expect(res.ok()).toBe(true);
    }
    await expect(page.locator('h1')).toContainText('Privacy');
  });

  test('theme toggle switches between light and dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    const html = page.locator('html');
    await expect(html).not.toHaveClass(/dark/);
    await page.getByRole('button', { name: 'Toggle light and dark theme' }).click();
    await expect(html).toHaveClass(/dark/);
  });

  test('fits a phone screen without sideways scrolling', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await expect(page.locator('#projects h3').first()).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
