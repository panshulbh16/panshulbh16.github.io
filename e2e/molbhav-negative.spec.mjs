// Negative and security tests for the Molbhav demo: bad input, blocked moves, hostile text and broken storage.
// Every assertion states what a real sales user should see. A failing test here points at an app bug, not a test to loosen.
import { test, expect, STORAGE_KEY } from './fixtures.mjs';

const DEMO_ONLY = 'In this demo only the built-in example works. The full version reads any text, PDF or photo with Claude.';
const XSS = [
  `<img src=x onerror="window.__xss=1">`,
  `<script>window.__xss=1</script>`,
  `"><svg onload=window.__xss=1>`,
];

const coll = async (app, name) => (await app.store()).data[name] || {};
const count = async (app, name) => Object.keys(await coll(app, name)).length;
const modal = page => page.locator('#modal-card');

/** Open a view and click one of its header buttons, then wait for the drawer form. */
async function startForm(app, page, view, act) {
  await app.open();
  await app.go(view);
  await page.locator(`#view [data-act="${act}"]`).first().click();
  await expect(page.locator('#drawer-body form[data-form]')).toBeVisible();
}

/** Submit the drawer form and wait until it either shows an error or closes. */
async function submitAndSettle(app, page) {
  await app.submit();
  await expect(page.locator('#drawer-body .form-err:not(:empty)').or(page.locator('#drawer[hidden]'))).toHaveCount(1);
}

async function submitModal(page) { await page.locator('#modal-card form [type="submit"]').click(); }

/** Nothing from a payload may have become a live element, and no handler may have run. */
async function expectNothingInjected(page) {
  const found = await page.evaluate(() => ({
    flag: typeof window.__xss,
    img: document.querySelectorAll('img[src="x"], img[onerror]').length,
    svg: document.querySelectorAll('svg[onload]').length,
    script: [...document.scripts].filter(s => s.textContent.includes('__xss')).length,
  }));
  expect(found).toEqual({ flag: 'undefined', img: 0, svg: 0, script: 0 });
}

async function openOpp(app, id) {
  await app.go('opportunities');
  await app.openRecord(id);
}

async function stageOf(app, id) { return (await coll(app, 'opps'))[id].stage; }

/* ------------------------------------------------------------------ */
test.describe('required fields', () => {
  test('an empty lead form asks for the company and saves nothing @negative', async ({ app, page }) => {
    await startForm(app, page, 'leads', 'newLead');
    const before = await count(app, 'leads');
    await app.submit();
    await expect(app.formError()).toHaveText('Company is required.');
    await app.fill({ company: '    ' });
    await app.submit();
    await expect(app.formError()).toHaveText('Company is required.');
    await expect(page.locator('#drawer-body form[data-form="lead"]')).toBeVisible();
    expect(await count(app, 'leads')).toBe(before);
  });

  test('an empty account form asks for the account name and saves nothing @negative', async ({ app, page }) => {
    await startForm(app, page, 'accounts', 'newAcc');
    const before = await count(app, 'accounts');
    await app.submit();
    await expect(app.formError()).toHaveText('Account name is required.');
    await expect(page.locator('#drawer-body form[data-form="acc"]')).toBeVisible();
    expect(await count(app, 'accounts')).toBe(before);
  });

  test('a contact needs a name and an account before it is saved @negative', async ({ app, page }) => {
    await startForm(app, page, 'contacts', 'newContact');
    const before = await count(app, 'contacts');
    await app.submit();
    await expect(app.formError()).toHaveText('Name is required.');
    await app.fill({ name: 'Suresh Iyer' });
    await app.submit();
    await expect(app.formError()).toHaveText('Account is required.');
    expect(await count(app, 'contacts')).toBe(before);
  });

  test('an opportunity needs a name, an account and a close date @negative', async ({ app, page }) => {
    await startForm(app, page, 'opportunities', 'newOpp');
    const before = await count(app, 'opps');
    await app.submit();
    await expect(app.formError()).toHaveText('Opportunity name is required.');
    await app.fill({ name: 'Hosur plant valves' });
    await app.submit();
    await expect(app.formError()).toHaveText('Account is required.');
    await app.fill({ accountId: { select: 'acc_peenya' }, closeDate: '' });
    await app.submit();
    await expect(app.formError()).toHaveText('Expected close is required.');
    expect(await count(app, 'opps')).toBe(before);
  });

  test('an activity needs a subject and a date @negative', async ({ app, page }) => {
    await startForm(app, page, 'activities', 'logAct');
    const before = await count(app, 'activities');
    await app.submit();
    await expect(app.formError()).toHaveText('Subject is required.');
    await app.fill({ subject: 'Call about the trial order', due: '' });
    await app.submit();
    await expect(app.formError()).toHaveText('Date is required.');
    expect(await count(app, 'activities')).toBe(before);
  });

  test('a product needs SKU, name, a valid HSN code and a list price @negative', async ({ app, page }) => {
    await startForm(app, page, 'products', 'newProduct');
    const before = await count(app, 'products');
    await app.submit();
    await expect(app.formError()).toHaveText('SKU is required.');
    await app.fill({ sku: 'VFC-GV-150' });
    await app.submit();
    await expect(app.formError()).toHaveText('Name is required.');
    await app.fill({ name: 'Gate valve 6" carbon steel' });
    await app.submit();
    await expect(app.formError()).toHaveText('HSN code is required.');
    await app.fill({ hsn: '8481' });
    await app.submit();
    await expect(app.formError()).toHaveText('List price (₹) is required.');
    await app.fill({ hsn: 'valve', listPrice: '21000' });
    await app.submit();
    await expect(app.formError()).toHaveText('HSN code should be 4 to 8 digits.');
    expect(await count(app, 'products')).toBe(before);
  });

  test('a relationship needs both records, and they must differ @negative', async ({ app, page }) => {
    await startForm(app, page, 'relationships', 'newRel');
    const before = await count(app, 'relationships');
    await app.submit();
    await expect(app.formError()).toHaveText('From is required.');
    await app.fill({ from: { select: 'acc:acc_kaveri' } });
    await app.submit();
    await expect(app.formError()).toHaveText('To is required.');
    await app.fill({ to: { select: 'acc:acc_kaveri' } });
    await app.submit();
    await expect(app.formError()).toHaveText('Pick two different records.');
    expect(await count(app, 'relationships')).toBe(before);
  });
});

/* ------------------------------------------------------------------ */
test.describe('GSTIN', () => {
  test('lead and account forms refuse a GSTIN from another state or in the wrong format @negative', async ({ app, page }) => {
    await startForm(app, page, 'leads', 'newLead');
    const leads = await count(app, 'leads');
    await app.fill({ company: 'Hosur Pumpsets', state: { select: 'Karnataka' }, gstin: '27AAGCS2290R1Z9' });
    await app.submit();
    await expect(app.formError()).toHaveText('GSTIN starts with 27, but Karnataka is 29');
    await app.fill({ gstin: '29ABC' });
    await app.submit();
    await expect(app.formError()).toHaveText('GSTIN format looks wrong: 15 characters, starting with the 2-digit state code');
    expect(await count(app, 'leads')).toBe(leads);
    await app.closeDrawer();

    await app.go('accounts');
    const accounts = await count(app, 'accounts');
    await page.locator('#view [data-act="newAcc"]').first().click();
    await app.fill({ name: 'Madurai Agro Pumps', state: { select: 'Tamil Nadu' }, gstin: '29aakck4821m1z7' });
    await app.submit();
    await expect(app.formError()).toHaveText('GSTIN starts with 29, but Tamil Nadu is 33');
    expect(await count(app, 'accounts')).toBe(accounts);
  });
});

/* ------------------------------------------------------------------ */
test.describe('numbers', () => {
  test('quote line quantity and extra discount never save out-of-range values and totals stay positive @negative', async ({ app, page }) => {
    await app.open();
    await openOpp(app, 'opp_peenya_skid');
    await page.locator('#drawer [data-act="newQuote"]').click();
    await expect.poll(async () => Object.entries(await coll(app, 'quotes')).find(([, q]) => q.oppId === 'opp_peenya_skid')).toBeTruthy();
    const [qid] = Object.entries(await coll(app, 'quotes')).find(([, q]) => q.oppId === 'opp_peenya_skid');
    await expect(page.locator('#drawer .dh .eyebrow')).toHaveText('Quote · version 1');
    const line = async () => (await coll(app, 'quotes'))[qid].lines[0];
    const qty = page.locator(`[id="qq-${qid}-0"]`);
    const extra = page.locator(`[id="qx-${qid}-0"]`);

    for (const bad of ['0', '-5']) {
      await qty.fill('25'); await qty.press('Tab');
      await expect.poll(async () => (await line()).qty).toBe(25);
      await qty.fill(bad); await qty.press('Tab');
      await expect(qty).toHaveValue('1');
      expect((await line()).qty, `quantity "${bad}"`).toBe(1);
    }
    await qty.fill('25'); await qty.press('Tab');
    await expect.poll(async () => (await line()).qty).toBe(25);
    await qty.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.type('abc');
    await page.keyboard.press('Tab');
    await expect(qty).toHaveValue('1');
    expect((await line()).qty, 'non-numeric quantity').toBe(1);

    const addForm = page.locator(`#drawer form[data-form="qline-${qid}"]`);
    await addForm.locator('[name="qty"]').fill('0');
    await addForm.locator('[type="submit"]').click();
    await expect(addForm.locator('.form-err')).toHaveText('Quantity can’t be below 1.');
    expect((await coll(app, 'quotes'))[qid].lines).toHaveLength(2);

    await extra.fill('-5'); await extra.press('Tab');
    await expect(extra).toHaveValue('0');
    expect((await line()).extraDiscountPct).toBe(0);
    await extra.fill('75'); await extra.press('Tab');
    await expect(extra).toHaveValue('60');
    expect((await line()).extraDiscountPct).toBe(60);
    await expect(page.locator('#drawer [data-act="qSubmit"]')).toHaveText('Submit for director approval');

    const calc = await app.logic((m, id) => m.quoteCalc(m.one('quotes', id)), qid);
    expect(calc.level).toBe('Director');
    expect(calc.lines.every(l => l.qty >= 1 && l.unit >= 0 && l.value >= 0)).toBe(true);
    expect(calc.taxable).toBeGreaterThan(0);
    expect(calc.total).toBeGreaterThan(calc.taxable);
  });

  test('a product with a negative list price or cost is refused @negative', async ({ app, page }) => {
    await startForm(app, page, 'products', 'newProduct');
    const before = await count(app, 'products');
    await app.fill({ sku: 'VFC-NG-001', name: 'Needle valve 1/2"', hsn: '848180', listPrice: '-1200' });
    await app.submit();
    await expect(app.formError()).toHaveText('List price (₹) can’t be below 0.');
    await app.fill({ listPrice: '1200', cost: '-300' });
    await app.submit();
    await expect(app.formError()).toHaveText('Standard cost (₹) can’t be below 0.');
    expect(await count(app, 'products')).toBe(before);
  });

  test('a price rule above the 90% discount limit is refused, so no price goes negative @negative', async ({ app, page }) => {
    await startForm(app, page, 'products', 'newRule');
    await expect(page.locator('#drawer-body [name="discountPct"]')).toHaveAttribute('max', '90');
    await app.fill({ name: 'Diwali super scheme', kind: { select: 'promo' }, discountPct: '150' });
    await submitAndSettle(app, page);
    const rules = Object.values(await coll(app, 'priceRules'));
    expect.soft(rules.filter(r => Number(r.discountPct) > 90), 'saved price rules above 90%').toEqual([]);
    const negative = await app.logic(m => m.all('products').map(p => [p.sku, m.priceFor(p.id, { tier: 'Dealer', state: 'Karnataka' }, 10).unit]).filter(([, u]) => u < 0));
    expect(negative, 'products with a negative net price').toEqual([]);
  });

  test('settings refuse a manager approval limit above the director limit @negative', async ({ app, page }) => {
    await startForm(app, page, 'settings', 'editSettings');
    const before = (await coll(app, 'settings')).org;
    await app.fill({ managerAbove: '25', directorAbove: '15' });
    await app.submit();
    await expect(app.formError()).toHaveText('The director limit must be at or above the manager limit.');
    expect((await coll(app, 'settings')).org).toEqual(before);

    await app.fill({ managerAbove: '30', directorAbove: '' });
    await submitAndSettle(app, page);
    const s = (await coll(app, 'settings')).org;
    expect(s.managerAbove, `saved manager ${s.managerAbove}% vs director ${s.directorAbove}%`).toBeLessThanOrEqual(s.directorAbove);
  });

  test('settings refuse a margin floor below 0% or above 90% @negative', async ({ app, page }) => {
    await startForm(app, page, 'settings', 'editSettings');
    const before = (await coll(app, 'settings')).org;
    await app.fill({ minMarginPct: '-5' });
    await app.submit();
    await expect(app.formError()).toHaveText('Margin floor on quotes (%) can’t be below 0.');
    expect((await coll(app, 'settings')).org).toEqual(before);

    await expect(page.locator('#drawer-body [name="minMarginPct"]')).toHaveAttribute('max', '90');
    await app.fill({ minMarginPct: '150' });
    await submitAndSettle(app, page);
    const floor = (await coll(app, 'settings')).org.minMarginPct;
    expect(floor ?? 18, 'saved margin floor').toBeLessThanOrEqual(90);
  });
});

/* ------------------------------------------------------------------ */
test.describe('stage gates', () => {
  test('an opportunity without product lines cannot move to Proposal or Negotiation @negative', async ({ app, page }) => {
    await app.open();
    await openOpp(app, 'opp_konkan_crude');
    for (const to of ['Proposal', 'Negotiation']) {
      await page.locator(`#drawer .path [data-stage="${to}"]`).click();
      await expect(modal(page).locator('h3')).toHaveText(`Can’t move to ${to} yet`);
      await expect(modal(page)).toContainText('Add at least one product line before moving to Proposal');
      await page.locator('#modal-card [data-act="closeModal"]').click();
      await expect(page.locator('#modal')).toBeHidden();
      expect(await stageOf(app, 'opp_konkan_crude')).toBe('Requirement');
    }
    await expect(page.locator('#drawer .path [aria-current="step"]')).toHaveText('Requirement & samples');
  });

  test('Negotiation is blocked while the only quote is still waiting for approval @negative', async ({ app, page }) => {
    await app.open();
    await openOpp(app, 'opp_deccan_unit3');
    await page.locator('#drawer .path [data-stage="Negotiation"]').click();
    await expect(modal(page).locator('h3')).toHaveText('Can’t move to Negotiation yet');
    await expect(modal(page)).toContainText('Quote QT/FY27/0007 is pending approval. Negotiation needs an approved or sent quote.');
    await expect(modal(page).locator('[data-act="open"][data-kind="quote"]')).toHaveText('Open quote');
    expect(await stageOf(app, 'opp_deccan_unit3')).toBe('Proposal');
  });

  test('closing as Won needs the customer PO number @negative', async ({ app, page }) => {
    await app.open();
    await openOpp(app, 'opp_peenya_skid');
    await page.locator('#drawer .path [data-stage="Won"]').click();
    await expect(modal(page).locator('h3')).toHaveText('Move to Won');
    await submitModal(page);
    await expect(modal(page).locator('.form-err')).toHaveText('Customer PO number is required.');
    await modal(page).locator('[name="poNumber"]').fill('   ');
    await submitModal(page);
    await expect(modal(page).locator('.form-err')).toHaveText('Customer PO number is required.');
    const o = (await coll(app, 'opps')).opp_peenya_skid;
    expect(o.stage).toBe('Proposal');
    expect(o.poNumber).toBeUndefined();
  });

  test('closing as Lost needs a loss reason the user actually chose @negative', async ({ app, page }) => {
    await app.open();
    await openOpp(app, 'opp_indus_cip');
    await page.locator('#drawer .path [data-stage="Lost"]').click();
    await expect(modal(page).locator('h3')).toHaveText('Move to Lost');
    await expect(modal(page)).toContainText('Why was it lost?');
    expect(await stageOf(app, 'opp_indus_cip')).toBe('Qualify');
    // Submitting straight away must not record a reason nobody picked.
    await submitModal(page);
    await expect(page.locator('#modal-card .form-err:not(:empty)').or(page.locator('#modal[hidden]'))).toHaveCount(1);
    const o = (await coll(app, 'opps')).opp_indus_cip;
    expect(o.stage, `closed as ${o.stage} with loss reason "${o.lossReason}" that the user never chose`).toBe('Qualify');
    expect(o.lossReason).toBeUndefined();
    await expect(modal(page).locator('.form-err')).toHaveText('Why was it lost? is required.');
  });
});

/* ------------------------------------------------------------------ */
test.describe('forecast', () => {
  test('a manager adjustment without a reason, or below zero, is refused @negative', async ({ app, page }) => {
    await app.open();
    await app.go('forecast');
    const before = await count(app, 'adjustments');
    await page.locator('#view [data-act="adjust"][data-rep="rep_arjun"]').click();
    await expect(modal(page).locator('h3')).toHaveText('Adjust Arjun Rao’s call');
    await modal(page).locator('[name="amount"]').fill('5000000');
    await submitModal(page);
    await expect(modal(page).locator('.form-err')).toHaveText('Reason is required.');
    await modal(page).locator('[name="reason"]').fill('   \n  ');
    await submitModal(page);
    await expect(modal(page).locator('.form-err')).toHaveText('Reason is required.');
    await modal(page).locator('[name="amount"]').fill('-100000');
    await modal(page).locator('[name="reason"]').fill('Customer delayed the PO');
    await submitModal(page);
    await expect(modal(page).locator('.form-err')).toHaveText('Manager call (₹) can’t be below 0.');
    expect(await count(app, 'adjustments')).toBe(before);
    await expect(page.locator('#view')).not.toContainText('Customer delayed the PO');
  });
});

/* ------------------------------------------------------------------ */
test.describe('demo AI inputs', () => {
  test('RFQ reader: empty text asks for the email first, any other text gets the demo-only message @negative', async ({ app, page }) => {
    await app.open();
    await app.go('quotes');
    const opps = await count(app, 'opps');
    await page.locator('#view [data-act="rfqOpen"]').click();
    const out = page.locator('#rfq-out');
    await page.locator('#drawer [data-act="rfqRead"]').click();
    await expect(out).toHaveText('Paste the email text first.');
    await page.locator('#rfq-text').fill('Dear Sir, please quote 25 nos 3 inch gate valves for our Hosur plant. Regards, Purchase');
    await page.locator('#drawer [data-act="rfqRead"]').click();
    await expect(out).toHaveText(DEMO_ONLY);
    await expect(page.locator('#drawer [data-act="rfqCreate"]')).toHaveCount(0);
    expect(await count(app, 'opps')).toBe(opps);
  });

  test('visit notes: empty notes ask for text first, any other notes get the demo-only message @negative', async ({ app, page }) => {
    await app.open();
    const acts = await count(app, 'activities');
    await page.locator('#view [data-act="notesOpen"]').first().click();
    const out = page.locator('#nt-out');
    await page.locator('#drawer [data-act="notesRead"]').click();
    await expect(out).toHaveText('Write or paste the notes first.');
    await page.locator('#nt-text').fill('Met Ravi at Peenya. They want the skid order split into two deliveries.');
    await page.locator('#drawer [data-act="notesRead"]').click();
    await expect(out).toHaveText(DEMO_ONLY);
    await expect(page.locator('#drawer [data-act="notesApply"]')).toHaveCount(0);
    expect(await count(app, 'activities')).toBe(acts);
  });

  test('BOQ reader: empty input asks for a file first; own text or any uploaded file gets the demo-only message @negative', async ({ app, page }) => {
    await app.open();
    await app.go('quotes');
    const quotes = await count(app, 'quotes');
    await page.locator('#view [data-act="boqOpen"]').click();
    const out = page.locator('#boq-out');
    const read = page.locator('#drawer [data-act="boqRead"]');
    await read.click();
    await expect(out).toHaveText('Add a file or paste the BOQ text first.');
    await page.locator('#boq-text').fill('1. Gate valve 80 NB, flanged – 25 Nos');
    await read.click();
    await expect(out).toHaveText(DEMO_ONLY);

    await page.locator('#boq-text').fill('');
    await page.locator('#boq-files').setInputFiles({ name: 'hosur-boq.csv', mimeType: 'text/csv', buffer: Buffer.from('Item,Qty\nGate valve 80 NB,25\n') });
    await expect(page.locator('#boq-list')).toHaveText('hosur-boq.csv (1 KB)');
    await read.click();
    await expect(out).toHaveText(DEMO_ONLY);
    await expect(page.locator('#drawer [data-act="boqCreate"]')).toHaveCount(0);
    expect(await count(app, 'quotes')).toBe(quotes);
  });
});

/* ------------------------------------------------------------------ */
test.describe('security', () => {
  test('script payloads in a lead company name show as text and never run @negative', async ({ app, page }) => {
    await app.open();
    await app.go('leads');
    for (const p of XSS) {
      await page.locator('#view [data-act="newLead"]').first().click();
      await app.fill({ company: p });
      await app.submit();
      await expect(page.locator('#drawer-body .dh h2')).toHaveText(p);
      await app.closeDrawer();
    }
    for (const p of XSS) await expect(app.view().locator('td .strong', { hasText: p })).toHaveCount(1);
    const saved = Object.values(await coll(app, 'leads')).map(l => l.company);
    expect(saved).toEqual(expect.arrayContaining(XSS));
    await app.go('home');
    await expectNothingInjected(page);
  });

  test('script payloads in requirement and activity text show as text and never run @negative', async ({ app, page }) => {
    await startForm(app, page, 'leads', 'newLead');
    await app.fill({ company: 'Sahyadri Agro Exports', requirement: XSS[0] });
    await app.submit();
    await expect(page.locator('#drawer-body .dl')).toContainText(XSS[0]);
    await page.locator('#drawer-body [data-act="logAct"]').first().click();
    await app.fill({ subject: XSS[2], notes: XSS[1] });
    await app.submit();
    const timeline = page.locator('#drawer-body .tl');
    await expect(timeline).toContainText(XSS[2]);
    await expect(timeline).toContainText(XSS[1]);
    await app.closeDrawer();
    await app.go('activities');
    await expect(app.view()).toContainText(XSS[2]);
    await expectNothingInjected(page);
  });

  test('script payloads typed into search boxes show as text and never run @negative', async ({ app, page }) => {
    await app.open();
    const cmd = page.locator('#cmd');
    for (const p of XSS) {
      await cmd.fill(p);
      await expect(page.locator('#cmd-drop [data-act="cmdAsk"]')).toHaveText(`Ask Claude: “${p}”Enter`);
      await expectNothingInjected(page);
    }
    await cmd.press('Enter');
    await expect(page.locator('#drawer-body .dh h2')).toHaveText(XSS[2]);
    await expect(page.locator('#ask-out')).toContainText('Demo answer');
    await app.closeDrawer();

    await app.go('leads');
    for (const p of XSS) {
      await page.locator('#leadQ').fill(p);
      await expect(app.view().locator('.empty h2')).toHaveText('No leads match');
      await expect(page.locator('#leadQ')).toHaveValue(p);
    }
    await expectNothingInjected(page);
  });
});

/* ------------------------------------------------------------------ */
test.describe('robustness', () => {
  test('a 5,000-character company name is saved in full and shown without breaking the page @negative', async ({ app, page }) => {
    const unit = 'Shree Ganesh Precision Valve and Pump Works ';
    const name = unit.repeat(Math.ceil(5000 / unit.length)).slice(0, 4999) + 'X';
    expect(name).toHaveLength(5000);
    await startForm(app, page, 'leads', 'newLead');
    await app.fill({ company: name });
    await app.submit();
    await expect(page.locator('#drawer-body .dh h2')).toHaveText(name);
    const saved = Object.values(await coll(app, 'leads')).find(l => l.company.startsWith(unit));
    expect(saved.company).toBe(name);
    await app.closeDrawer();
    await expect(app.view().locator('td .strong', { hasText: unit })).toHaveText(name);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, 'horizontal page scroll in pixels').toBeLessThanOrEqual(0);
  });

  test('Hindi (Devanagari) text is saved, shown and searchable @negative', async ({ app, page }) => {
    const lead = { company: 'श्री गणेश वाल्व्स प्राइवेट लिमिटेड', contactName: 'राजेश कुमार शर्मा', city: 'पुणे', requirement: 'हमें 50 बॉल वाल्व चाहिए, डिलीवरी दिवाली से पहले' };
    await startForm(app, page, 'leads', 'newLead');
    await app.fill({ ...lead, state: { select: 'Maharashtra' } });
    await app.submit();
    await expect(page.locator('#drawer-body .dh h2')).toHaveText(lead.company);
    await expect(page.locator('#drawer-body .dl')).toContainText(lead.contactName);
    await expect(page.locator('#drawer-body .dl')).toContainText('पुणे, Maharashtra');
    await expect(page.locator('#drawer-body .dl')).toContainText(lead.requirement);
    const saved = Object.values(await coll(app, 'leads')).find(l => l.contactName === lead.contactName);
    expect(saved).toMatchObject(lead);
    await app.closeDrawer();
    await page.locator('#leadQ').fill('गणेश');
    await expect(app.view().locator('tbody tr')).toHaveCount(1);
    await expect(app.view().locator('tbody tr')).toContainText(lead.company);
  });

  test('corrupted saved data is replaced with the sample data @negative', async ({ app, page }) => {
    const broken = '{"v":1,"seededFor":"2026-10-13","data":{"leads":{"x"';
    await app.open({ before: `localStorage.setItem(${JSON.stringify(STORAGE_KEY)}, ${JSON.stringify(broken)});` });
    await expect(page.locator('.banner.demo')).toContainText('Live demo');
    const s = await app.store();
    expect(s.v).toBe(1);
    expect(Object.keys(s.data.opps)).toHaveLength(16);
    expect(Object.keys(s.data.leads)).toHaveLength(10);
    await app.go('leads');
    await expect(app.view()).toContainText('Shivalik Food Processors');
  });

  test('saved data from another demo version is reseeded @negative', async ({ app, page }) => {
    const old = { v: 99, seededFor: '2026-10-13', data: { leads: { lead_stale: { company: 'Stale Lead From Old Version', status: 'New', state: 'Karnataka', createdAt: '2026-10-13' } } } };
    await app.open({ before: `localStorage.setItem(${JSON.stringify(STORAGE_KEY)}, ${JSON.stringify(JSON.stringify(old))});` });
    const s = await app.store();
    expect(s.v).toBe(1);
    expect(s.data.leads.lead_stale).toBeUndefined();
    expect(Object.keys(s.data.opps)).toHaveLength(16);
    await app.go('leads');
    await expect(app.view()).toContainText('Shivalik Food Processors');
    await expect(app.view()).not.toContainText('Stale Lead From Old Version');
  });

  test('when every localStorage call throws, the demo still renders and works in memory @negative', async ({ app, page }) => {
    await app.open({ before: () => {
      const deny = () => { throw new DOMException('Access is denied for this document.', 'SecurityError'); };
      for (const k of ['getItem', 'setItem', 'removeItem', 'clear', 'key']) Storage.prototype[k] = deny;
      Object.defineProperty(window, 'localStorage', { configurable: true, get: deny });
    } });
    await expect(page.locator('.banner.demo')).toContainText('Live demo');
    await expect(page.locator('#view h1')).toHaveText('Overview');
    await app.go('leads');
    await page.locator('#view [data-act="newLead"]').first().click();
    await app.fill({ company: 'In Memory Traders' });
    await app.submit();
    await expect(page.locator('#drawer-body .dh h2')).toHaveText('In Memory Traders');
    await app.closeDrawer();
    await expect(app.view()).toContainText('In Memory Traders');
    expect(await app.logic(m => Object.keys(m.S.leads).length)).toBe(11);
  });

  test('double-clicking a form’s submit button creates exactly one record @negative', async ({ app, page }) => {
    await startForm(app, page, 'leads', 'newLead');
    const before = await count(app, 'leads');
    await app.fill({ company: 'Double Click Industries' });
    await page.locator('#drawer-body form [type="submit"]').dblclick();
    await expect(page.locator('#drawer-body .dh h2')).toHaveText('Double Click Industries');
    const leads = Object.values(await coll(app, 'leads'));
    expect(leads.filter(l => l.company === 'Double Click Industries')).toHaveLength(1);
    expect(leads).toHaveLength(before + 1);
    await expect(page.locator('#modal')).toBeHidden();
  });

  test('Escape closes the dialog first, then the drawer, and saves nothing half-filled @negative', async ({ app, page }) => {
    await app.open();
    await openOpp(app, 'opp_indus_cip');
    await page.locator('#drawer .path [data-stage="Lost"]').click();
    await expect(page.locator('#modal')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#modal')).toBeHidden();
    await expect(page.locator('#drawer')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#drawer')).toBeHidden();
    expect(await stageOf(app, 'opp_indus_cip')).toBe('Qualify');

    await app.go('leads');
    await page.locator('#view [data-act="newLead"]').first().click();
    await app.fill({ company: 'Half Typed Lead' });
    await page.keyboard.press('Escape');
    await expect(page.locator('#drawer')).toBeHidden();
    expect(Object.values(await coll(app, 'leads')).some(l => l.company === 'Half Typed Lead')).toBe(false);
  });

  test('an unknown hash keeps a valid page @negative', async ({ app, page }) => {
    await app.open({ path: '/molbhav/#doesnotexist' });
    await expect(page.locator('#nav a[href="#home"]')).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('#view h1')).toHaveText('Overview');
    await app.go('leads');
    // The app's own hashchange listener was added first, so it has run by the time this one resolves.
    await page.evaluate(() => new Promise(done => { addEventListener('hashchange', () => done(), { once: true }); location.hash = 'doesnotexist'; }));
    await expect(page.locator('#view h1')).toHaveText('Leads');
    await expect(page.locator('#nav a[href="#leads"]')).toHaveAttribute('aria-current', 'page');
    await expect(app.view()).not.toContainText('Something went wrong');
  });

  test('an unknown path on the site serves the 404 page @negative', async ({ page, request }) => {
    // Loading a missing page makes Chrome log the 404 itself; any other console error still fails the test.
    test.info().annotations.push({ type: 'allow-console-errors' });
    const errors = [];
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', e => errors.push(e.message));
    for (const path of ['/molbhav/no-such-page', '/does-not-exist.html']) {
      const r = await request.get(path);
      expect(r.status(), path).toBe(404);
      const html = await r.text();
      expect(html).toContain('<h1>Not found</h1>');
      expect(html).toContain('<a href="/">');
    }
    const res = await page.goto('/molbhav/no-such-page');
    expect(res.status()).toBe(404);
    expect(await res.text()).toContain('That page isn’t on this site.');
    await expect(page).toHaveURL(/127\.0\.0\.1:4173\/$/);
    await expect(page.locator('.card h3').first()).toBeVisible();
    expect(errors.filter(t => !/status of 404/.test(t)), 'errors other than the expected 404').toEqual([]);
  });
});

