// Portfolio checks: product card media load, including the Roamly video loop.
import { test, expect } from './fixtures.mjs';

test.describe('portfolio', () => {
  test('every product card image loads', async ({ page }) => {
    await page.goto('/');
    const imgs = page.locator('.card img');
    await expect(imgs).toHaveCount(3);
    for (let i = 0; i < 3; i++) {
      const img = imgs.nth(i);
      await img.scrollIntoViewIfNeeded();
      await expect.poll(() => img.evaluate(el => (el.complete ? el.naturalWidth : 0)), { message: `card image ${i + 1} should load` }).toBeGreaterThan(0);
    }
  });

  test('the Roamly card video has a poster and playable sources', async ({ page, request }) => {
    await page.goto('/');
    const video = page.locator('.card .window-video');
    await expect(video).toHaveCount(1);
    await expect(video).toHaveAttribute('muted', '');
    await expect(video).toHaveAttribute('playsinline', '');
    const poster = await video.getAttribute('poster');
    expect((await request.get(poster)).status()).toBe(200);
    for (const src of await video.locator('source').evaluateAll(list => list.map(s => s.getAttribute('src')))) {
      const head = await request.head(src);
      expect(head.status(), src).toBe(200);
    }
    await video.scrollIntoViewIfNeeded();
    await video.hover();
    await expect.poll(() => video.evaluate(v => v.readyState), { message: 'video should start loading on hover' }).toBeGreaterThan(0);
  });
});
