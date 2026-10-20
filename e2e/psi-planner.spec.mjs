// End-to-end tests for the PSI Planning Grid (/psi-planner/).
import { test, expect } from './fixtures.mjs';

const URL = '/psi-planner/';
const KEY = 'psi-grid-v2';

// Start every test from sample data (clear storage on the first load only, so reloads keep state),
// and record CSP violations so they fail the test like console errors do.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('psi-test-cleared')) {
      localStorage.clear();
      sessionStorage.setItem('psi-test-cleared', '1');
    }
    window.__csp = [];
    document.addEventListener('securitypolicyviolation', e => window.__csp.push(`${e.violatedDirective} ${e.blockedURI}`));
  });
});
test.afterEach(async ({ page }) => {
  if (page.isClosed()) return;
  expect(await page.evaluate(() => window.__csp || []), 'CSP violations').toEqual([]);
});

const open = async page => {
  await page.goto(URL);
  await expect(page.locator('#psi tbody tr').first()).toBeVisible();
};
const txt = (page, sel) => page.locator(sel).innerText();
const n = s => Number(String(s).replace(/[,\s%]/g, ''));
// Solve the active item in the page with the page's own solver.
const solved = page => page.evaluate(() => { const r = solve(S.items[S.active], S.view); return { eoh: r.eoh, dem: r.dem, plan: r.plan, ss: r.ss, n: r.n, lab: r.B.map(b => b.lab) }; });
const stored = page => page.evaluate(k => JSON.parse(localStorage.getItem(k)), KEY);
const tabCodes = page => page.locator('#tabs [data-tab] .code').allInnerTexts();
const weekHeaders = page => page.locator('#psi thead th .wk').allInnerTexts();

test.describe('PSI planner @smoke', () => {
  test('loads three sample items with a full grid, KPIs, chart and messages', async ({ page }) => {
    await open(page);
    await expect(page).toHaveTitle('PSI Planning Grid');
    expect(await tabCodes(page)).toEqual(['FG-1001', 'FG-2040', 'RM-0310']);
    await expect(page.locator('#tabs [data-tab="0"]')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#vWeekly')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#pdCount')).toHaveText('12');
    await expect(page.locator('#psi thead th')).toHaveCount(14);
    expect((await weekHeaders(page)).slice(0, 3)).toEqual(['W43', 'W44', 'W45']);
    for (const k of ['fc', 'so', 'firm', 'ss']) await expect(page.locator(`#c-${k}-0`)).toBeVisible();
    await expect(page.locator('#c-cap-0')).toHaveCount(0);
    await expect(page.locator('#kpis .kpi')).toHaveCount(7);
    await expect(page.locator('#kpis')).not.toContainText('Peak capacity used');
    await expect(page.locator('#chart svg')).toBeVisible();
    await expect(page.locator('#exceptions li').first()).toBeVisible();
    const r = await solved(page);
    for (let i = 0; i < r.n; i++) expect(n(await txt(page, `#v-eoh-${i}`))).toBeCloseTo(r.eoh[i], 2);
    await expect(page.locator('#psi td.c')).not.toContainText(['-0']);
  });

  test('typing a sales order recalculates demand, ending on hand, totals and KPIs live', async ({ page }) => {
    await open(page);
    const before = await solved(page);
    const kpiBefore = await txt(page, '#kpis');
    const totBefore = n(await txt(page, '#t-so'));
    const cell = page.locator('#c-so-0');
    await cell.click();
    await expect(cell).toHaveValue('340');
    await cell.fill('1340');
    await expect(page.locator('#t-so')).toHaveText(new Intl.NumberFormat('en-IN').format(totBefore + 1000));
    await expect(page.locator('#v-dem-0')).toHaveText('1,340');
    const after = await solved(page);
    expect(after.dem[0]).toBe(1340);
    for (let i = 0; i < after.n; i++) expect(n(await txt(page, `#v-eoh-${i}`))).toBeCloseTo(after.eoh[i], 2);
    expect(after.eoh).not.toEqual(before.eoh);
    await expect(page.locator('#kpis')).not.toHaveText(kpiBefore);
    await cell.press('Tab');
    await expect(cell).toHaveValue('1,340');
  });
});

test('forecast edits outside the demand fence drive demand through the consumption rule', async ({ page }) => {
  await open(page);
  // FG-1001: DTF 14 days = 2 weeks, consume GREATER. Week 5 forecast 380 vs orders 80.
  await expect(page.locator('#v-dem-4')).toHaveText('380');
  await page.locator('#c-fc-4').fill('50');
  await expect(page.locator('#v-dem-4')).toHaveText('80');
  await page.locator('#c-fc-0').fill('9999');
  await expect(page.locator('#v-dem-0')).toHaveText('340');
  const r = await solved(page);
  expect(n(await txt(page, '#t-dem'))).toBe(r.dem.reduce((a, v) => a + v, 0));
});

test('Enter, Shift+Enter and arrow keys move between input cells', async ({ page }) => {
  await open(page);
  await page.locator('#c-fc-0').click();
  await page.keyboard.press('Enter');
  await expect(page.locator('#c-fc-1')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#c-fc-2')).toBeFocused();
  await page.keyboard.press('Shift+Enter');
  await expect(page.locator('#c-fc-1')).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('#c-so-1')).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('#c-firm-1')).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('#c-ss-1')).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('#c-ss-1')).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await expect(page.locator('#c-firm-1')).toBeFocused();
  await page.locator('#c-fc-11').click();
  await page.keyboard.press('Enter');
  await expect(page.locator('#c-fc-11')).toBeFocused();
  await page.locator('#c-fc-0').click();
  await page.keyboard.press('Shift+Enter');
  await expect(page.locator('#c-fc-0')).toBeFocused();
});

test('pasting a tab-separated row spreads across periods, blanks become zero', async ({ page }) => {
  await open(page);
  const cell = page.locator('#c-fc-2');
  await cell.focus();
  await cell.evaluate(el => {
    const dt = new DataTransfer();
    dt.setData('text/plain', '100\t1,200\t\t300\r\n');
    el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
  });
  await expect(page.locator('#toast')).toHaveText('Pasted 4 periods');
  await expect(cell).toHaveValue('100');
  await expect(page.locator('#c-fc-3')).toHaveValue('1,200');
  await expect(page.locator('#c-fc-4')).toHaveValue('0');
  await expect(page.locator('#c-fc-5')).toHaveValue('300');
  await expect(page.locator('#c-fc-1')).toHaveValue('340');
  await expect(page.locator('#c-fc-6')).toHaveValue('400');
  const fc = await page.evaluate(() => S.items[0].wk.fc);
  expect(fc.slice(1, 7)).toEqual([340, 100, 1200, 0, 300, 400]);

  // A paste running past the horizon is truncated; a single value pastes normally.
  const last = page.locator('#c-so-10');
  await last.focus();
  await last.evaluate(el => {
    const dt = new DataTransfer();
    dt.setData('text/plain', '7\n8\n9');
    el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
  });
  await expect(page.locator('#toast')).toHaveText('Pasted 2 periods');
  expect(await page.evaluate(() => S.items[0].wk.so.slice(10))).toEqual([7, 8]);
  expect(await page.evaluate(() => S.items[0].wk.so.length)).toBe(12);
});

test('Fill → copies period 1 to every period', async ({ page }) => {
  await open(page);
  await page.locator('#c-firm-0').fill('250');
  await page.locator('[data-fill="firm"]').click();
  await expect(page.locator('#toast')).toHaveText('Filled every period with 250');
  for (let i = 0; i < 12; i++) await expect(page.locator(`#c-firm-${i}`)).toHaveValue('250');
  await expect(page.locator('#t-firm')).toHaveText('3,000');
});

test('weekly and monthly views keep separate data and labels', async ({ page }) => {
  await open(page);
  await page.locator('#c-fc-0').fill('777');
  await page.locator('#vMonthly').click();
  await expect(page.locator('#vMonthly')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#gridTitle')).toHaveText('Monthly projection');
  await expect(page.locator('#hStartM')).toBeVisible();
  await expect(page.locator('#hStartW')).toBeHidden();
  await expect(page.locator('#hStartM')).toHaveValue('2026-10');
  expect((await weekHeaders(page)).slice(0, 3)).toEqual(['Oct', 'Nov', 'Dec']);
  await expect(page.locator('#c-fc-0')).toHaveValue('1,450');
  await page.locator('#c-fc-0').fill('2000');
  await page.locator('#vWeekly').click();
  await expect(page.locator('#c-fc-0')).toHaveValue('777');
  await page.locator('#vMonthly').click();
  await expect(page.locator('#c-fc-0')).toHaveValue('2,000');
});

test('period stepper adds and removes periods within 4–52 weekly and 3–24 monthly', async ({ page }) => {
  await open(page);
  const cells = page.locator('[id^="c-fc-"]');
  await page.locator('#pdPlus').click();
  await expect(page.locator('#pdCount')).toHaveText('13');
  await expect(cells).toHaveCount(13);
  await expect(page.locator('#c-ss-12')).toHaveValue('500');
  for (let i = 0; i < 10; i++) await page.locator('#pdMinus').click();
  await expect(page.locator('#pdCount')).toHaveText('4');
  await page.locator('#pdMinus').click();
  await expect(page.locator('#pdCount')).toHaveText('4');
  await expect(cells).toHaveCount(4);
  await page.evaluate(() => { S.items[0].wk.n = 51; normalize(); renderAll(); });
  await page.locator('#pdPlus').click();
  await page.locator('#pdPlus').click();
  await expect(page.locator('#pdCount')).toHaveText('52');
  await expect(cells).toHaveCount(52);

  await page.locator('#vMonthly').click();
  await expect(page.locator('#pdCount')).toHaveText('12');
  for (let i = 0; i < 10; i++) await page.locator('#pdMinus').click();
  await expect(page.locator('#pdCount')).toHaveText('3');
  await expect(cells).toHaveCount(3);
  await page.evaluate(() => { S.items[0].mo.n = 23; normalize(); renderAll(); });
  await page.locator('#pdPlus').click();
  await page.locator('#pdPlus').click();
  await expect(page.locator('#pdCount')).toHaveText('24');
  expect((await weekHeaders(page)).at(-2)).toBe('Sep');
});

test('changing the start date relabels the headers, including the W53 rollover', async ({ page }) => {
  await open(page);
  await page.locator('#hStartW').fill('2026-12-21');
  await expect(page.locator('#psi thead th .wk').first()).toHaveText('W52');
  expect((await weekHeaders(page)).slice(0, 3)).toEqual(['W52', 'W53', 'W01']);
  await expect(page.locator('#psi thead th .dt').first()).toHaveText('21 Dec');
  await expect(page.locator('#horizonText')).toContainText('W52 2026 (21 Dec) to W10 2027');
  await page.locator('#vMonthly').click();
  await page.locator('#hStartM').fill('2027-02');
  await expect(page.locator('#psi thead th .wk').first()).toHaveText('Feb');
  await expect(page.locator('#psi thead th .dt').first()).toHaveText('2027');
  await expect.poll(async () => (await stored(page))?.items[0].mo.start).toBe('2027-02');
  await page.reload();
  await expect(page.locator('#hStartM')).toHaveValue('2027-02');
});

test('safety stock method toggles the input row and the calculated row', async ({ page }) => {
  await open(page);
  const ssIn = page.locator('#c-ss-0'), ssCalc = page.locator('#v-ssv-0');
  await expect(ssIn).toBeVisible();
  await expect(ssCalc).toHaveCount(0);
  await expect(page.locator('#pSsd')).toBeHidden();
  await page.locator('#pSsm').selectOption('DOC');
  await expect(ssIn).toHaveCount(0);
  await expect(ssCalc).toBeVisible();
  await expect(page.locator('#pSsd')).toBeVisible();
  await expect(page.locator('#ssHint')).toHaveText('14 days of cover');
  const doc = await solved(page);
  await expect(ssCalc).toHaveText(new Intl.NumberFormat('en-IN').format(doc.ss[0]));
  await page.locator('#pSsd').fill('28');
  await expect(page.locator('#ssHint')).toHaveText('28 days of cover');
  expect((await solved(page)).ss[0]).toBeGreaterThan(doc.ss[0]);
  await page.locator('#pSsm').selectOption('STAT');
  await expect(page.locator('#pSvc')).toBeVisible();
  await expect(page.locator('#pSsd')).toBeHidden();
  await expect(page.locator('#ssHint')).toHaveText('95% service, z 1.64');
  await expect(page.locator('#ssReadout')).toContainText('z 1.64 × σ');
  await page.locator('#pSsm').selectOption('USER');
  await expect(ssIn).toHaveValue('500');
  await expect(page.locator('#psi')).not.toContainText('z 1.64');
});

test('capacity constraint toggles the capacity and utilisation rows', async ({ page }) => {
  await open(page);
  await expect(page.locator('#c-cap-0')).toHaveCount(0);
  await expect(page.locator('#pBa')).toBeHidden();
  await expect(page.locator('#lgCap')).toBeHidden();
  await page.locator('#pCap').check();
  await expect(page.locator('#c-cap-0')).toHaveValue('700');
  await expect(page.locator('#v-util-0')).toContainText('%');
  await expect(page.locator('#pBa')).toBeVisible();
  await expect(page.locator('#lgCap')).toBeVisible();
  await expect(page.locator('#kpis')).toContainText('Peak capacity used');
  await page.locator('[data-fill="cap"]').scrollIntoViewIfNeeded();
  await page.locator('#c-cap-0').fill('0');
  await page.locator('[data-fill="cap"]').click();
  await expect(page.locator('#exceptions')).toContainText('Capacity');
  await page.locator('#pCap').uncheck();
  await expect(page.locator('#c-cap-0')).toHaveCount(0);
  await expect(page.locator('#v-util-0')).toHaveCount(0);
  // Sample item 2 is constrained already.
  await page.locator('[data-tab="1"]').click();
  await expect(page.locator('#c-cap-0')).toHaveValue('260');
  await expect(page.locator('#pCap')).toBeChecked();
});

test('lot sizing rule shows only its own fields', async ({ page }) => {
  await open(page);
  const vis = async () => ({ foq: await page.locator('#pFoq').isVisible(), fds: await page.locator('#pFds').isVisible(), min: await page.locator('#pMinInv').isVisible(), max: await page.locator('#pMaxInv').isVisible() });
  expect(await vis()).toEqual({ foq: false, fds: false, min: false, max: false });
  await page.locator('#pLot').selectOption('FOQ');
  expect(await vis()).toEqual({ foq: true, fds: false, min: false, max: false });
  await expect(page.locator('#planHint')).toContainText('Fixed order qty');
  await page.locator('#pLot').selectOption('FDS');
  expect(await vis()).toEqual({ foq: false, fds: true, min: false, max: false });
  await page.locator('#pLot').selectOption('MINMAX');
  expect(await vis()).toEqual({ foq: false, fds: false, min: true, max: true });
  await expect(page.locator('#solverSummary')).toContainText('Min–max');
  await page.locator('#pLot').selectOption('L4L');
  expect(await vis()).toEqual({ foq: false, fds: false, min: false, max: false });
});

test('time fence and planning parameters update the grid', async ({ page }) => {
  await open(page);
  await expect(page.locator('#psi thead .tag.ptf')).toHaveCount(1);
  await page.locator('#pPtf').fill('21');
  await expect(page.locator('#psi thead .tag.ptf')).toHaveCount(3);
  await expect(page.locator('#planHint')).toContainText('none in first 3 weeks');
  await page.locator('#pDtf').fill('0');
  await expect(page.locator('#psi thead .tag.dtf')).toHaveCount(0);
  await page.locator('#pAuto').uncheck();
  await expect(page.locator('#planHint')).toHaveText('Planned orders off');
  await expect(page.locator('#t-plan')).toHaveText('0');
  await page.locator('#pFirm').uncheck();
  await expect(page.locator('#firmHint')).toHaveText('Excluded from plan');
  await page.locator('#pPre').fill('3');
  await expect(page.locator('#ltReadout')).toHaveText('18 days ≈ 3 weeks');
  await page.locator('#fBoh').fill('5000');
  await expect(page.locator('#v-boh-0')).toHaveText('5,000');
});

test('add an item, rename it in the tab, then delete it with a two-click confirm', async ({ page }) => {
  await open(page);
  await page.locator('#addItem').click();
  expect(await tabCodes(page)).toEqual(['FG-1001', 'FG-2040', 'RM-0310', 'NEW-004']);
  await expect(page.locator('#tabs [data-tab="3"]')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#fCode')).toBeFocused();
  await expect(page.locator('#c-fc-0')).toHaveValue('0');
  await expect(page.locator('#psi td.c')).not.toContainText(['-0']);
  await expect(page.locator('#pAuto')).not.toBeChecked();
  await page.keyboard.type('FG-9000');
  await expect(page.locator('#tabs [data-tab="3"] .code')).toHaveText('FG-9000');
  await page.locator('#fCode').fill('<b>x</b>');
  await expect(page.locator('#tabs [data-tab="3"] .code')).toHaveText('<b>x</b>');
  await page.locator('#fCode').fill('FG-9000');

  const del = page.locator('#delItem');
  await del.click();
  await expect(del).toHaveText('Click again to delete');
  await expect(del).toHaveClass(/armed/);
  expect(await tabCodes(page)).toHaveLength(4);
  await del.click();
  await expect(page.locator('#toast')).toHaveText('Deleted FG-9000');
  expect(await tabCodes(page)).toEqual(['FG-1001', 'FG-2040', 'RM-0310']);
  await expect(page.locator('#tabs [data-tab="2"]')).toHaveAttribute('aria-selected', 'true');
  await expect(del).toHaveText('Delete item');
});

test('delete is disabled for the last item and its confirm disarms on its own', async ({ page }) => {
  await page.clock.install();
  await open(page);
  const del = page.locator('#delItem');
  await del.click();
  await expect(del).toHaveText('Click again to delete');
  await page.clock.runFor(4100);
  await expect(del).toHaveText('Delete item');
  for (let i = 0; i < 2; i++) { await del.click(); await del.click(); }
  expect(await tabCodes(page)).toEqual(['RM-0310']);
  await expect(del).toBeDisabled();
});

test('reset needs two clicks and restores the sample data', async ({ page }) => {
  await open(page);
  await page.locator('#c-fc-0').fill('1');
  await page.locator('#addItem').click();
  const reset = page.locator('#resetAll');
  await reset.click();
  await expect(reset).toHaveText('Click again to reset');
  expect(await tabCodes(page)).toHaveLength(4);
  await reset.click();
  await expect(page.locator('#toast')).toHaveText('Sample data restored');
  await expect(reset).toHaveText('Reset to sample data');
  expect(await tabCodes(page)).toEqual(['FG-1001', 'FG-2040', 'RM-0310']);
  await expect(page.locator('#c-fc-0')).toHaveValue('320');
});

test('edits persist across a reload', async ({ page }) => {
  await open(page);
  await page.locator('[data-tab="1"]').click();
  await page.locator('#c-fc-3').fill('4321');
  await page.locator('#fDesc').fill('Renamed hose');
  await page.locator('#pLot').selectOption('L4L');
  await page.locator('#vMonthly').click();
  await expect.poll(async () => (await stored(page))?.view).toBe('monthly');
  const s = await stored(page);
  expect(s.active).toBe(1);
  expect(s.items[1].wk.fc[3]).toBe(4321);
  await page.reload();
  await expect(page.locator('#vMonthly')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#tabs [data-tab="1"]')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#fDesc')).toHaveValue('Renamed hose');
  await expect(page.locator('#pLot')).toHaveValue('L4L');
  await page.locator('#vWeekly').click();
  await expect(page.locator('#c-fc-3')).toHaveValue('4,321');
});

test('corrupt saved state falls back to the sample data', async ({ page }) => {
  await open(page);
  await page.evaluate(k => localStorage.setItem(k, '{not json'), KEY);
  await page.reload();
  expect(await tabCodes(page)).toEqual(['FG-1001', 'FG-2040', 'RM-0310']);
  await page.evaluate(k => localStorage.setItem(k, JSON.stringify({ view: 'yearly', active: 9, items: [{ code: 'X', boh: 5, p: {}, wk: { n: 999, start: 'bad', fc: [1] } }] })), KEY);
  await page.reload();
  expect(await tabCodes(page)).toEqual(['X']);
  await expect(page.locator('#vWeekly')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#pdCount')).toHaveText('52');
  await expect(page.locator('#hStartW')).toHaveValue('2026-10-19');
});

test('Copy as CSV puts the active grid on the clipboard', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await open(page);
  await page.locator('#copyCsv').click();
  await expect(page.locator('#toast')).toHaveText('Copied weekly CSV for FG-1001');
  const csv = await page.evaluate(() => navigator.clipboard.readText());
  const lines = csv.split('\n');
  expect(lines[0]).toBe('FG-1001 Steel mounting bracket 40 mm (EA) - weekly,W43 19 Oct,W44 26 Oct,W45 02 Nov,W46 09 Nov,W47 16 Nov,W48 23 Nov,W49 30 Nov,W50 07 Dec,W51 14 Dec,W52 21 Dec,W53 28 Dec,W01 04 Jan');
  const rows = await page.locator('#psi tbody tr').count();
  expect(lines).toHaveLength(rows + 1);
  expect(lines.map(l => l.split(',')[0]).slice(1)).toEqual(await page.locator('#psi tbody .m-name').allInnerTexts());
  for (const l of lines.slice(1)) expect(l.split(',')).toHaveLength(13);
  const r = await solved(page);
  expect(lines.find(l => l.startsWith('Ending on hand,'))).toBe(['Ending on hand', ...r.eoh.map(v => Math.round(v * 100) / 100)].join(','));

  // Quotes in the description are escaped; capacity rows appear on constrained items.
  await page.locator('[data-tab="1"]').click();
  await page.locator('#vMonthly').click();
  await page.locator('#copyCsv').click();
  await expect(page.locator('#toast')).toHaveText('Copied monthly CSV for FG-2040');
  const csv2 = await page.evaluate(() => navigator.clipboard.readText());
  expect(csv2.split('\n')[0]).toMatch(/^"FG-2040 Hydraulic hose assembly 3\/8"" \(EA\) - monthly",Oct 2026,/);
  expect(csv2).toMatch(/\nCapacity,700,/);
  expect(csv2).toMatch(/\nCapacity used,\d+%,/);
  expect(csv2.split('\n')).toHaveLength(await page.locator('#psi tbody tr').count() + 1);
});

test('mobile width has no horizontal page scroll', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  for (const v of ['#vWeekly', '#vMonthly']) {
    await page.locator(v).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.locator('#pCap').check();
  await page.evaluate(() => { S.items[0].wk.n = 52; });
  await page.locator('#vWeekly').click();
  await page.locator('#pdPlus').click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.locator('.grid-wrap')).toHaveCSS('overflow-x', 'auto');
});

test('dark color scheme renders with dark tokens', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await open(page);
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(16, 20, 28)');
  await expect(page.locator('#chart svg')).toBeVisible();
  await page.locator('[data-tab="2"]').click();
  await page.locator('#vMonthly').click();
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(243, 245, 248)');
});

test('every sample item renders in both views without errors or CSP violations', async ({ page }) => {
  await open(page);
  for (const v of ['#vWeekly', '#vMonthly']) {
    await page.locator(v).click();
    for (let t = 0; t < 3; t++) {
      await page.locator(`[data-tab="${t}"]`).click();
      for (const m of ['USER', 'DOC', 'STAT']) await page.locator('#pSsm').selectOption(m);
      await expect(page.locator('#kpis .kpi').first()).toBeVisible();
    }
  }
  expect(await page.evaluate(() => window.__csp)).toEqual([]);
  const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
  expect(csp).toContain("script-src 'self'");
  expect(await page.locator('script:not([src])').count()).toBe(0);
});
