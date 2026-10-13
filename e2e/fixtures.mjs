// Shared fixtures for the Molbhav and portfolio tests.
// - Every test fails if the page throws or logs a console error (font requests are stubbed).
// - `app.open()` loads the demo with a fixed clock (13 Oct 2026, 12:00 IST) so numbers are stable,
//   and exposes the app's pure functions as window.__molbhav for logic tests.
import { test as base, expect } from '@playwright/test';

export const FIXED_NOW = new Date('2026-10-13T06:30:00Z');
export const STORAGE_KEY = 'molbhav-demo-v1';
export const VIEWS = ['home', 'leads', 'accounts', 'contacts', 'opportunities', 'relationships', 'quotes', 'activities', 'forecast', 'territories', 'products', 'settings'];

class App {
  constructor(page) { this.page = page; }

  async open({ fixedTime = true, hooks = true, path = '/molbhav/', before } = {}) {
    if (fixedTime) await this.page.clock.setFixedTime(FIXED_NOW);
    if (hooks) await this.page.addInitScript(() => { window.MOLBHAV_TEST_HOOKS = true; });
    if (before) await this.page.addInitScript(before);
    await this.page.goto(path);
    await this.ready();
  }

  async ready() {
    await this.page.waitForFunction(() => { const v = document.querySelector('#view'); return !!v && v.textContent.length > 300; });
  }

  async go(view) {
    await this.page.evaluate(v => { location.hash = v; }, view);
    await expect(this.page.locator(`#nav a[href="#${view}"]`)).toHaveAttribute('aria-current', 'page');
  }

  view() { return this.page.locator('#view'); }
  drawer() { return this.page.locator('#drawer-body'); }
  toasts() { return this.page.locator('#toast .toast'); }

  async openRecord(id) {
    await this.page.locator(`#view [data-act="open"][data-id="${id}"]`).first().click();
    await expect(this.page.locator('#drawer')).toBeVisible();
  }

  async closeDrawer() {
    const d = this.page.locator('#drawer');
    if (await d.isVisible()) { await this.page.locator('#drawer .sheet-top [data-act="closeDrawer"]').click(); await expect(d).toBeHidden(); }
  }

  /** Fill a drawer form by field name. Values: string for inputs/textareas, {select: value} for selects. */
  async fill(values) {
    for (const [name, v] of Object.entries(values)) {
      const el = this.page.locator(`#drawer-body [name="${name}"]`);
      if (v && typeof v === 'object' && 'select' in v) await el.selectOption(v.select);
      else await el.fill(String(v));
    }
  }

  async submit() { await this.page.locator('#drawer-body form [type="submit"]').click(); }
  formError() { return this.page.locator('#drawer-body .form-err'); }

  async store() {
    return this.page.evaluate(k => JSON.parse(localStorage.getItem(k) || 'null'), STORAGE_KEY);
  }

  /** Run a function against the app's internals (window.__molbhav). */
  async logic(fn, arg) {
    return this.page.evaluate(([src, a]) => (0, eval)(`(${src})`)(window.__molbhav, a), [fn.toString(), arg]);
  }
}

export const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    const errors = [];
    page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
    page.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
    await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ status: 200, contentType: r.request().url().includes('/css') ? 'text/css' : 'font/woff2', body: '' }));
    await use(page);
    if (!testInfo.annotations.some(a => a.type === 'allow-console-errors')) expect(errors, 'browser errors during the test').toEqual([]);
  },
  app: async ({ page }, use) => { await use(new App(page)); },
});

export { expect };
