// End-to-end happy paths through the Molbhav demo, plus the portfolio page that hosts it.
// Each test starts from the sample data with the clock fixed at 13 Oct 2026, 12:00 IST (a Tuesday).
// Expected amounts are worked out by hand from the sample price lists, not read back from the app.
import { test, expect, VIEWS } from './fixtures.mjs';

const TODAY = '2026-10-13';

/* ---------- helpers ---------- */
const toast = (app, text) => app.toasts().filter({ hasText: text });
const pill = app => app.drawer().locator('.dh .meta .pill').first();
const ddFor = (scope, label) => scope.locator(`dt:text-is("${label}") + dd`);
const docs = async (app, coll) => Object.entries((await app.store()).data[coll] || {}).map(([id, d]) => ({ id, ...d }));

async function modalFill(page, values) {
  for (const [name, v] of Object.entries(values)) await page.locator(`#modal-card [name="${name}"]`).fill(String(v));
}
async function modalSubmit(page) {
  await page.locator('#modal-card form [type="submit"]').click();
  await expect(page.locator('#modal')).toBeHidden();
}
async function setExtraDiscount(app, index, pct) {
  const input = app.drawer().locator('input[data-chg="qExtra"]').nth(index);
  await input.fill(String(pct));
  await input.press('Tab');
}
/** Opens an opportunity from the pipeline list and creates a draft quote from its product lines. */
async function draftQuoteFrom(app, page, oppId) {
  await app.go('opportunities');
  await app.openRecord(oppId);
  await page.locator('#drawer-body [data-act="newQuote"]').click();
  await expect(toast(app, 'Draft quote created.')).toBeVisible();
  await expect(app.drawer().locator('.dh .eyebrow')).toHaveText('Quote · version 1');
  const q = (await docs(app, 'quotes')).find(x => x.oppId === oppId && x.status === 'Draft');
  expect(q, `draft quote for ${oppId}`).toBeTruthy();
  return q;
}

/* ---------- 12 views ---------- */
const VIEW_CHECKS = {
  home: { h1: 'Overview', text: ['Open pipeline', '₹2.68 Cr', '13 opportunities', 'QT/FY27/0007 needs sales manager approval', 'Hot leads'], sel: '.kpi', n: 4 },
  leads: { h1: 'Leads', text: ['9 open', 'Nandi Hills Water Contractors', 'Kutch Salt & Chemicals'], sel: 'tr[data-kind="lead"]', n: 9 },
  accounts: { h1: 'Accounts', text: ['16 customers', 'Kaveri Agro Systems', 'Sahyadri Infra Utilities'], sel: 'tr[data-kind="acc"]', n: 16 },
  contacts: { h1: 'Contacts', text: ['17 people', 'Aditi Kulkarni', 'Prakash Gowda'], sel: 'tr[data-kind="con"]', n: 17 },
  opportunities: { h1: 'Opportunities', text: ['13 open worth ₹2.68 Cr', 'Sahyadri — Pune 24x7 water scheme valves'], sel: 'tr[data-kind="opp"]', n: 13 },
  relationships: { h1: 'Relationships', text: ['Relationship map', 'Jalnidhi Water Consultants', 'Specifier for'], sel: '[data-act="editRel"]', n: 12 },
  quotes: { h1: 'Quotes', text: ['QT/FY27/0007', 'Pending approval', '1 waiting'], sel: 'tr[data-kind="quote"]', n: 5 },
  activities: { h1: 'Activities', text: ['Overdue', 'Next 7 days', 'Confirm delivery schedule with Prakash'], sel: 'input[data-act="toggleDone"]', n: 11 },
  forecast: { h1: 'Forecast · Q3 FY27', text: ['Manager call', '₹1.26 Cr', '74% of ₹1.70 Cr quota', 'Arjun Rao'], sel: '[data-act="adjust"]', n: 6 },
  territories: { h1: 'Territories', text: ['Key accounts: Oil & gas (West)', 'Catch-all', 'Reps and quotas'], sel: '.terr', n: 5 },
  products: { h1: 'Products & pricing', text: ['Price checker', 'VFC-BV-050', 'Distributor price list'], sel: '[data-act="editProduct"]', n: 10 },
  settings: { h1: 'Settings', text: ['Vardhan Flow Controls (sample)', '135 sample records', 'Karnataka (29)'], sel: '[data-act="editSettings"]', n: 1 },
};

test.describe('views', () => {
  for (const view of VIEWS) {
    test(`${view} view renders its heading and the sample records`, async ({ app }) => {
      const c = VIEW_CHECKS[view];
      await app.open();
      await app.go(view);
      await expect(app.view().locator('.page-h h1').first()).toHaveText(c.h1);
      for (const t of c.text) await expect(app.view()).toContainText(t);
      await expect(app.view().locator(c.sel)).toHaveCount(c.n);
      await expect(app.view().locator('.empty')).toHaveCount(0);
    });
  }
});

/* ---------- leads ---------- */
test.describe('leads', () => {
  test('a new lead is scored, routed to the most specific territory, then round-robin by open leads', async ({ app, page }) => {
    await app.open();
    await app.go('leads');
    const newLeadsBadge = page.locator('#nav a[href="#leads"] .count');
    await expect(newLeadsBadge).toHaveText('6');
    await page.locator('#view [data-act="newLead"]').first().click();
    await app.fill({
      company: 'Bharuch Gas Terminals', contactName: 'Hetal Mehta', phone: '+91 98250 11223', city: 'Bharuch',
      state: { select: 'Gujarat' }, industry: { select: 'Oil & gas' }, source: { select: 'Referral' }, turnoverBand: { select: '₹25–100 Cr' },
      gstin: '24AAACJ4321K1Z7', requirement: 'Forty 4-inch flanged ball valves with pneumatic actuators for the LNG unloading line.',
    });
    await app.submit();
    await expect(toast(app, 'Lead added and assigned to Farhan Shaikh.')).toBeVisible();
    const d = app.drawer();
    await expect(d.locator('.dh h2')).toHaveText('Bharuch Gas Terminals');
    await expect(d.locator('.dh .meta')).toContainText('Owner: Farhan Shaikh');
    // Referral 20 + target industry 20 + turnover 12 + valid GSTIN 10 + detailed requirement 20 + touched today 15
    await expect(d).toContainText('Score 97 of 100');
    await expect(ddFor(d, 'Routing')).toHaveText('Key accounts: Oil & gas (West): Farhan Shaikh had the fewest open leads (0 of 15).');

    // South has Arjun (1 open lead) and Kavya (1 open lead): the tie goes to Arjun, the next lead to Kavya.
    const southLeads = [
      ['Hassan Drip Irrigation Co', 'Arjun Rao', 'South: Arjun Rao had the fewest open leads (1 of 25).'],
      ['Mandya Canal Works', 'Kavya Nair', 'South: Kavya Nair had the fewest open leads (1 of 20).'],
    ];
    for (const [company, rep, note] of southLeads) {
      await app.closeDrawer();
      await page.locator('#view [data-act="newLead"]').first().click();
      await app.fill({ company, state: { select: 'Karnataka' }, industry: { select: 'Water & irrigation' }, source: { select: 'Website' } });
      await app.submit();
      await expect(d.locator('.dh h2')).toHaveText(company);
      await expect(d.locator('.dh .meta')).toContainText(`Owner: ${rep}`);
      await expect(ddFor(d, 'Routing')).toHaveText(note);
    }

    const leads = await docs(app, 'leads');
    const by = c => leads.find(l => l.company === c);
    expect(by('Bharuch Gas Terminals')).toMatchObject({ status: 'New', ownerId: 'rep_farhan', territoryId: 'ter_key', state: 'Gujarat', gstin: '24AAACJ4321K1Z7', createdAt: TODAY });
    expect(by('Hassan Drip Irrigation Co')).toMatchObject({ status: 'New', ownerId: 'rep_arjun', territoryId: 'ter_south' });
    expect(by('Mandya Canal Works')).toMatchObject({ status: 'New', ownerId: 'rep_kavya', territoryId: 'ter_south' });

    await app.closeDrawer();
    const row = app.view().locator('tr[data-kind="lead"]', { hasText: 'Bharuch Gas Terminals' });
    await expect(row).toContainText('Farhan Shaikh');
    await expect(row.locator('.score')).toHaveText('97');
    await expect(app.view().locator('.page-h .sub')).toContainText('12 open');
    await expect(newLeadsBadge).toHaveText('9');
  });

  test('converting a qualified lead creates the account, the contact and an opportunity', async ({ app, page }) => {
    await app.open();
    await app.go('leads');
    await app.openRecord('lead_godavari');
    await page.locator('#drawer-body [data-act="convertLead"]').click();
    await expect(page.locator('#drawer-body [name="accountChoice"]')).toHaveValue('new');
    await app.fill({ est: '450000' });
    await app.submit();
    await expect(toast(app, 'Lead converted.')).toBeVisible();

    const d = app.drawer();
    await expect(d.locator('.dh .eyebrow')).toHaveText('Opportunity · Pipeline');
    await expect(d.locator('.dh h2')).toHaveText('Godavari Aqua Farms — Submersible pumps, 5 HP, for 40 ponds before…');
    await expect(d.locator('.dh .meta')).toContainText('Owner: Arjun Rao');
    await expect(d.locator('.path button.cur')).toHaveText('Qualify');
    await expect(d.locator('.bigamt')).toContainText('₹4,50,000');

    const s = (await app.store()).data;
    const lead = s.leads.lead_godavari;
    expect(lead.status).toBe('Converted');
    const { accountId, contactId, oppId } = lead.convertedTo;
    expect(s.accounts[accountId]).toMatchObject({ name: 'Godavari Aqua Farms', state: 'Andhra Pradesh', gstin: '37AAGFG2231M1Z8', territoryId: 'ter_south', ownerId: 'rep_arjun' });
    expect(s.contacts[contactId]).toMatchObject({ name: 'Suresh Varma', primaryAccountId: accountId, accountIds: [accountId], role: 'Decision maker' });
    expect(s.opps[oppId]).toMatchObject({ accountId, contactId, ownerId: 'rep_arjun', stage: 'Qualify', estAmount: 450000, closeDate: '2026-11-27', source: 'Trade show' });

    await app.closeDrawer();
    await expect(app.view().locator('tr[data-kind="lead"]', { hasText: 'Godavari Aqua Farms' })).toHaveCount(0);
    await page.locator('#view [data-act="seg"][data-k="leadF"][data-v="Converted"]').click();
    await expect(app.view().locator('tr[data-kind="lead"]', { hasText: 'Godavari Aqua Farms' })).toContainText('Converted');
  });
});

/* ---------- quotes and approvals ---------- */
test.describe('quotes and approvals', () => {
  test('a quote is created from an opportunity after adding priced product lines', async ({ app, page }) => {
    await app.open();
    await app.go('opportunities');
    await app.openRecord('opp_indus_cip');
    const d = app.drawer();
    const lineForm = d.locator('form[data-form="oppline-opp_indus_cip"]');
    // Direct customer: 60 ball valves get the 50+ slab (3%), 2 pumps get the pump launch offer (4%).
    await lineForm.locator('[name="productId"]').selectOption('prd_bv050');
    await lineForm.locator('[name="qty"]').fill('60');
    await lineForm.getByRole('button', { name: 'Add line' }).click();
    await expect(toast(app, 'Added at ₹6,644.50 each (Volume slab 50+ −3%).')).toBeVisible();
    await expect(d.locator('input[data-chg="oppQty"]')).toHaveCount(1);
    await lineForm.locator('[name="productId"]').selectOption('prd_cp075');
    await lineForm.locator('[name="qty"]').fill('2');
    await lineForm.getByRole('button', { name: 'Add line' }).click();
    await expect(toast(app, 'Added at ₹65,760.00 each (Pump launch offer −4%).')).toBeVisible();
    await expect(d.locator('input[data-chg="oppQty"]')).toHaveCount(2);
    await expect(d.locator('.bigamt')).toContainText('₹5,30,190');

    await d.locator('[data-act="newQuote"]').click();
    await expect(toast(app, 'Draft quote created.')).toBeVisible();
    await expect(d.locator('.dh .eyebrow')).toHaveText('Quote · version 1');
    await expect(d.locator('.dh h2')).toHaveText('QT/FY27/0008');
    await expect(pill(app)).toHaveText('Draft');
    // Taxable 5,30,190 + IGST 18% (Punjab is out of state) 95,434.20
    await expect(d.locator('.bigamt')).toContainText('₹6,25,624.20');
    await expect(ddFor(d, 'IGST')).toHaveText('₹95,434.20');
    await expect(d).toContainText('Different state from yours (Karnataka): IGST applies.');
    await expect(d.locator('[data-act="qSubmit"]')).toHaveText('Approve (within limits)');

    const q = (await docs(app, 'quotes')).find(x => x.oppId === 'opp_indus_cip');
    expect(q).toMatchObject({ number: 'QT/FY27/0008', version: 1, status: 'Draft', accountId: 'acc_indus', placeOfSupply: 'Punjab', validUntil: '2026-11-12', createdAt: TODAY });
    expect(q.lines).toEqual([
      expect.objectContaining({ productId: 'prd_bv050', qty: 60, listPrice: 6850, ruleDiscountPct: 3, extraDiscountPct: 0, gstRate: 18 }),
      expect.objectContaining({ productId: 'prd_cp075', qty: 2, listPrice: 68500, ruleDiscountPct: 4, extraDiscountPct: 0, gstRate: 18 }),
    ]);
  });

  test('an extra discount goes through manager approval, is sent, and the customer accepts with a PO', async ({ app, page }) => {
    await app.open();
    const q0 = await draftQuoteFrom(app, page, 'opp_ganga_noida');
    const d = app.drawer();
    await setExtraDiscount(app, 0, 12);
    await expect(d.locator('[data-act="qSubmit"]')).toHaveText('Submit for sales manager approval');
    await expect(d).toContainText('Highest extra discount is 12%, so this quote needs sales manager approval');
    // Dealer price list 15% + Diwali scheme 3%, then 12% extra on the butterfly valves; IGST to Uttar Pradesh.
    await expect(d.locator('.bigamt')).toContainText('₹6,99,872.40');

    await d.locator('[data-act="qSubmit"]').click();
    await expect(toast(app, 'Sent for sales manager approval.')).toBeVisible();
    await expect(pill(app)).toHaveText('Pending approval');

    await d.locator('[data-act="qApprove"]').click();
    await expect(page.locator('#modal-card h3')).toHaveText('Approve QT/FY27/0008?');
    await expect(page.locator('#modal-card > p').first()).toHaveText('12% extra discount · ₹6,99,872 incl. GST');
    await expect(page.locator('#modal-card [name="by"]')).toHaveValue('Meera Iyer');
    await modalFill(page, { note: 'OK for the Noida towers order.' });
    await modalSubmit(page);
    await expect(toast(app, 'Quote approved.')).toBeVisible();
    await expect(pill(app)).toHaveText('Approved');
    await expect(d).toContainText('Approved by Meera Iyer on 13 Oct 2026');

    await d.locator('[data-act="qSent"]').click();
    await expect(toast(app, 'Marked as sent. Opportunity lines updated, and a follow-up call is booked in 5 days.')).toBeVisible();
    await expect(pill(app)).toHaveText('Sent');

    await d.locator('[data-act="qAccept"]').click();
    await expect(page.locator('#modal-card h3')).toHaveText('Customer accepted');
    await modalFill(page, { poNumber: 'GBS/PO/2026/118' });
    await modalSubmit(page);
    await expect(toast(app, 'Ganga — Noida towers fire and HVAC valves moved to Won.')).toBeVisible();
    await expect(pill(app)).toHaveText('Accepted');
    await expect(ddFor(d, 'Customer PO')).toHaveText('GBS/PO/2026/118');
    await expect(ddFor(d, 'Accepted on')).toHaveText('13 Oct 2026');

    const s = (await app.store()).data;
    expect(s.quotes[q0.id]).toMatchObject({ status: 'Accepted', poNumber: 'GBS/PO/2026/118', sentAt: TODAY, acceptedAt: TODAY,
      approval: { level: 'Sales manager', status: 'Approved', by: 'Meera Iyer', at: TODAY, note: 'OK for the Noida towers order.' } });
    const opp = s.opps.opp_ganga_noida;
    expect(opp).toMatchObject({ stage: 'Won', poNumber: 'GBS/PO/2026/118', closeDate: TODAY });
    expect(opp.history.at(-1)).toMatchObject({ from: 'Proposal', to: 'Won' });
    expect(opp.lines[0]).toMatchObject({ productId: 'prd_bf150', unitPrice: 8996.94 });
    expect(opp.lines[0].ruleNote).toContain('extra −12%');
    const followUps = Object.values(s.activities).filter(a => a.subject === 'Follow up on quote QT/FY27/0008');
    expect(followUps).toEqual([expect.objectContaining({ type: 'Call', due: '2026-10-18', done: false, ownerId: 'rep_simran', related: { kind: 'opp', id: 'opp_ganga_noida' } })]);
  });

  test('revising an approved quote creates version 2 as a draft and supersedes version 1', async ({ app, page }) => {
    await app.open();
    await app.go('quotes');
    await app.openRecord('qt_0006');
    const d = app.drawer();
    await expect(pill(app)).toHaveText('Approved');
    await d.locator('[data-act="qRevise"]').click();
    await expect(toast(app, 'Version 2 created as a draft.')).toBeVisible();
    await expect(d.locator('.dh .eyebrow')).toHaveText('Quote · version 2');
    await expect(d.locator('.dh h2')).toHaveText('QT/FY27/0006');
    await expect(pill(app)).toHaveText('Draft');
    await expect(d.locator('input[data-chg="qExtra"]')).toHaveCount(4);
    await expect(d.locator('input[data-chg="qExtra"]').first()).toHaveValue('12');
    await expect(d.locator('[data-act="qSubmit"]')).toHaveText('Submit for sales manager approval');

    const quotes = await docs(app, 'quotes');
    const v1 = quotes.find(x => x.id === 'qt_0006');
    const v2 = quotes.find(x => x.number === 'QT/FY27/0006' && x.version === 2);
    expect(v1.status).toBe('Superseded');
    expect(v2).toMatchObject({ status: 'Draft', oppId: 'opp_saurashtra_shutdown', accountId: 'acc_saurashtra', placeOfSupply: 'Gujarat', validUntil: '2026-11-12', createdAt: TODAY });
    expect(v2.lines).toEqual(v1.lines);
    expect(v2.approval).toBeUndefined();

    await app.closeDrawer();
    const rows = app.view().locator('tr[data-kind="quote"]', { hasText: 'QT/FY27/0006' });
    await expect(rows).toHaveCount(1);
    await expect(rows).toContainText('version 2');
    await page.locator('#view [data-act="seg"][data-k="quoteF"][data-v="All"]').click();
    await expect(rows).toHaveCount(2);
    const oldRow = app.view().locator('tr[data-kind="quote"][data-id="qt_0006"]');
    await expect(oldRow).toHaveClass(/\bdim\b/);
    await expect(oldRow).toContainText('Superseded');
    await oldRow.click();
    await expect(d.locator('.coach')).toContainText('Replaced by version 2');
    await d.locator('.coach a', { hasText: 'version 2' }).click();
    await expect(d.locator('.dh .eyebrow')).toHaveText('Quote · version 2');

    // The opportunity lists both versions, newest first, with version 1 dimmed.
    await d.locator('.dh .meta a', { hasText: 'Saurashtra — refinery shutdown valve replacement' }).click();
    const versions = d.locator('tr[data-kind="quote"]');
    await expect(versions).toHaveCount(2);
    await expect(versions.nth(0)).toContainText('QT/FY27/0006 · v2');
    await expect(versions.nth(0)).toContainText('Draft');
    await expect(versions.nth(1)).toContainText('QT/FY27/0006 · v1');
    await expect(versions.nth(1)).toContainText('Superseded');
    await expect(versions.nth(1)).toHaveClass(/\bdim\b/);
  });

  test('changing place of supply turns CGST + SGST into IGST with the same tax, and the customer copy shows it in words', async ({ app, page }) => {
    await app.open();
    const q = await draftQuoteFrom(app, page, 'opp_peenya_skid');
    const d = app.drawer();
    // Peenya (OEM, Karnataka): 80 ball valves at 10% + 3% slab, 30 check valves at 10%. Tax 18% = 1,33,740.72.
    await expect(d).toContainText('Same state as you (Karnataka): GST splits into CGST and SGST.');
    await expect(ddFor(d, 'Taxable value')).toHaveText('₹7,43,004.00');
    await expect(ddFor(d, 'CGST')).toHaveText('₹66,870.36');
    await expect(ddFor(d, 'SGST')).toHaveText('₹66,870.36');
    await expect(ddFor(d, 'Total')).toHaveText('₹8,76,744.72');
    await expect(ddFor(d, 'IGST')).toHaveCount(0);

    await d.locator('select[data-chg="qPos"]').selectOption('Maharashtra');
    await expect(d).toContainText('Different state from yours (Karnataka): IGST applies.');
    await expect(ddFor(d, 'IGST')).toHaveText('₹1,33,740.72');
    await expect(ddFor(d, 'CGST')).toHaveCount(0);
    await expect(ddFor(d, 'SGST')).toHaveCount(0);
    await expect(ddFor(d, 'Total')).toHaveText('₹8,76,744.72');

    await d.locator('[data-act="qDoc"]').click();
    const doc = d.locator('.qdoc');
    await expect(doc).toBeVisible();
    await expect(doc.locator('.qd-to')).toContainText('Maharashtra (27)');
    await expect(doc.locator('.qd-to')).toContainText('Inter-state: IGST');
    await expect(doc.locator('.qd-table tbody tr')).toHaveCount(2);
    await expect(doc.locator('.qd-tot tr', { hasText: 'IGST' }).locator('td.num')).toHaveText('₹1,33,740.72');
    await expect(doc.locator('.qd-tot tr', { hasText: 'Total' }).locator('td.num')).toHaveText('₹8,76,744.72');
    await expect(doc.locator('.words')).toHaveText('Rupees Eight Lakh Seventy Six Thousand Seven Hundred Forty Four and Seventy Two Paise Only');

    const saved = (await app.store()).data.quotes[q.id];
    expect(saved.placeOfSupply).toBe('Maharashtra');
  });

  test('the approval brief on the pending quote recommends a counter-offer, and Send back returns it to draft with it', async ({ app, page }) => {
    await app.open();
    await app.go('quotes');
    await page.locator('#view [data-act="seg"][data-k="quoteF"][data-v="Pending approval"]').click();
    await expect(app.view().locator('tr[data-kind="quote"]')).toHaveCount(1);
    await app.openRecord('qt_0007');
    const d = app.drawer();
    await expect(pill(app)).toHaveText('Pending approval');
    // Cost 3,43,200 against 4,60,944 before and 4,11,229.44 after the 14% extra discount on the pumps.
    await expect(d.locator('.mini', { hasText: 'Before extra discount' }).locator('.v')).toHaveText('25.5%');
    await expect(d.locator('.mini', { hasText: 'After extra discount' }).locator('.v')).toHaveText('16.5%');
    await expect(d).toContainText('Below the 18% margin floor set in Settings.');

    await d.locator('[data-act="apprBrief"]').click();
    const brief = d.locator('.review');
    await expect(brief.locator('.hrow .pill')).toHaveText('Counter at 9%');
    await expect(brief.locator('.hrow b')).toHaveText('At 14% the margin drops to 16.5%, under the 18% floor. Up to 9% keeps it at the floor.');
    await expect(brief).toContainText('Margin is 25.5% before the extra discount and 16.5% after it');
    await expect(brief).toContainText('The extra discount costs ₹49,715 on this quote');
    await expect(brief).toContainText('Will the customer commit to a yearly volume at this price?');

    await d.locator('[data-act="apprCounter"]').click();
    await expect(toast(app, 'Sent back to draft with a 9% counter-offer.')).toBeVisible();
    await expect(pill(app)).toHaveText('Draft');
    await expect(d).toContainText('Sent back on 13 Oct 2026');
    await expect(d).toContainText('Counter-offer: approve up to 9% extra discount.');
    await expect(d.locator('[data-act="qSubmit"]')).toHaveText('Submit for sales manager approval');
    await expect(page.locator('#nav a[href="#quotes"] .count')).toHaveCount(0);

    const q = (await app.store()).data.quotes.qt_0007;
    expect(q.status).toBe('Draft');
    expect(q.approval).toMatchObject({ level: 'Sales manager', status: 'Rejected', at: TODAY });
    expect(q.approval.note).toBe('Counter-offer: approve up to 9% extra discount. At 14% the margin drops to 16.5%, under the 18% floor. Up to 9% keeps it at the floor.');
  });
});

/* ---------- AI previews ---------- */
test.describe('AI previews', () => {
  test('the RFQ example becomes a new opportunity and a draft quote priced from the distributor list', async ({ app, page }) => {
    await app.open();
    await app.go('quotes');
    await page.locator('#view [data-act="rfqOpen"]').click();
    const d = app.drawer();
    await d.locator('[data-act="rfqExample"]').click();
    await expect(d.locator('#rfq-text')).toHaveValue(/Kaveri Agro Systems/);
    await d.locator('[data-act="rfqRead"]').click();
    await expect(d.locator('#rfq-acc')).toHaveValue('acc_kaveri');
    await expect(d.locator('#rfq-out')).toContainText('Delivery: Mysuru warehouse by 15 November');
    await expect(d.locator('#rfq-p-0')).toHaveValue('prd_bv050');
    await expect(d.locator('#rfq-q-0')).toHaveValue('150');
    await expect(d.locator('#rfq-p-1')).toHaveValue('prd_bf150');
    await expect(d.locator('#rfq-q-1')).toHaveValue('40');
    await expect(d.locator('#rfq-p-2')).toHaveValue('prd_sk001');
    await expect(d.locator('#rfq-q-2')).toHaveValue('200');

    await d.locator('[data-act="rfqCreate"]').click();
    await expect(toast(app, 'Draft quote created.')).toBeVisible();
    await expect(d.locator('.dh h2')).toHaveText('QT/FY27/0008');
    await expect(pill(app)).toHaveText('Draft');
    await expect(d.locator('.dh .meta')).toContainText('Kaveri Agro Systems — RFQ 13 Oct');
    await expect(d.locator('input[data-chg="qQty"]')).toHaveCount(3);

    const s = (await app.store()).data;
    const opp = Object.values(s.opps).find(o => o.source === 'RFQ email');
    expect(opp).toMatchObject({ name: 'Kaveri Agro Systems — RFQ 13 Oct', accountId: 'acc_kaveri', contactId: 'con_prakash', ownerId: 'rep_arjun', stage: 'Proposal', closeDate: '2026-11-12' });
    // Distributor list 22%, plus the 50+ slab on 150 ball valves and the 200+ slab on 200 seal kits.
    expect(opp.lines.map(l => [l.productId, l.qty, l.unitPrice])).toEqual([['prd_bv050', 150, 5182.71], ['prd_bf150', 40, 9672], ['prd_sk001', 200, 1370.85]]);
    const q = Object.values(s.quotes).find(x => x.number === 'QT/FY27/0008');
    expect(q).toMatchObject({ status: 'Draft', accountId: 'acc_kaveri', placeOfSupply: 'Karnataka' });
    expect(q.lines.map(l => [l.productId, l.ruleDiscountPct])).toEqual([['prd_bv050', 24.34], ['prd_bf150', 22], ['prd_sk001', 25.9]]);
  });

  test('the BOQ example becomes a draft quote and the unmatched item goes to engineering as a task', async ({ app, page }) => {
    await app.open();
    await app.go('quotes');
    await page.locator('#view [data-act="boqOpen"]').click();
    const d = app.drawer();
    await d.locator('[data-act="boqExample"]').click();
    await d.locator('[data-act="boqRead"]').click();
    const out = d.locator('#boq-out');
    await expect(out).toContainText('4 of 5 items matched');
    await expect(out).toContainText('Project: Mysuru drip irrigation project');
    await expect(out).toContainText('Skipped as not our products: HDPE pipe 90 mm PN6, 1200 m');
    await expect(d.locator('#boq-acc2')).toHaveValue('acc_kaveri');
    await expect(d.locator('#boq-p-2')).toHaveValue('prd_cv100');
    await expect(d.locator('#boq-p-4')).toHaveValue('');
    await expect(out.locator('tbody tr').nth(4)).toContainText('no match');

    await d.locator('[data-act="boqCreate"]').click();
    await expect(toast(app, '1 unmatched item sent to engineering as a task.')).toBeVisible();
    await expect(toast(app, 'Draft quote created.')).toBeVisible();
    await expect(d.locator('.dh h2')).toHaveText('QT/FY27/0008');
    await expect(pill(app)).toHaveText('Draft');
    await expect(d.locator('input[data-chg="qQty"]')).toHaveCount(4);

    const s = (await app.store()).data;
    const [oppId, opp] = Object.entries(s.opps).find(([, o]) => o.source === 'Drawing / BOQ');
    expect(opp).toMatchObject({ name: 'Kaveri Agro Systems — Mysuru drip irrigation project 13 Oct', accountId: 'acc_kaveri', stage: 'Proposal' });
    expect(opp.lines.map(l => [l.productId, l.qty])).toEqual([['prd_bv050', 150], ['prd_bf150', 40], ['prd_cv100', 12], ['prd_sk001', 80]]);
    const tasks = Object.values(s.activities).filter(a => a.related && a.related.id === oppId);
    expect(tasks).toEqual([expect.objectContaining({ type: 'Task', subject: 'Check 1 BOQ item with engineering', due: '2026-10-15', done: false, ownerId: 'rep_arjun',
      notes: '6: Air release valve 25 NB, double acting × 30 (Not in the catalogue)' })]);
    expect(Object.values(s.quotes).find(q => q.oppId === oppId)).toMatchObject({ number: 'QT/FY27/0008', status: 'Draft' });
  });

  test('the visit-notes example updates the Sahyadri opportunity: stage, close date and activities', async ({ app, page }) => {
    await app.open();
    await app.go('opportunities');
    await app.openRecord('opp_sahyadri_pune');
    const d = app.drawer();
    await d.locator('[data-act="notesOpen"]').click();
    await d.locator('[data-act="notesExample"]').click();
    await d.locator('[data-act="notesRead"]').click();
    const list = d.locator('#nt-out .checklist');
    await expect(list).toContainText('Log Visit done today: Met Aditi Kulkarni on the Pune scheme');
    await expect(list).toContainText('Move stage from Negotiation to Proposal');
    await expect(list).toContainText('Change close date from 16 Dec 2026 to 15 Jan 2027');
    await expect(list).toContainText('Schedule Task on 16 Oct 2026: Send revised quote to Aditi');
    await expect(list).toContainText('Schedule Meeting on 19 Oct 2026: Meet consultant Vikram Joshi');
    await expect(list).toContainText('Customer asked for 5% extra discount on 12-inch butterfly valves.');
    await expect(d.locator('#nt-opp')).toHaveValue('opp_sahyadri_pune');

    await d.locator('[data-act="notesApply"]').click();
    await expect(toast(app, 'Updated: visit logged, close date 15 Jan, stage Proposal, task on 16 Oct, meeting on 19 Oct.')).toBeVisible();
    await expect(d.locator('.dh h2')).toHaveText('Sahyadri — Pune 24x7 water scheme valves');
    await expect(d.locator('.path button.cur')).toHaveText('Proposal');
    await expect(d.locator('.dh .meta')).toContainText('Close 15 Jan 2027');
    const timeline = d.locator('.tl').last();
    await expect(timeline).toContainText('Met Aditi Kulkarni on the Pune scheme');
    await expect(timeline).toContainText('Send revised quote to Aditi');
    await expect(timeline).toContainText('Meet consultant Vikram Joshi');

    const s = (await app.store()).data;
    const o = s.opps.opp_sahyadri_pune;
    expect(o).toMatchObject({ stage: 'Proposal', closeDate: '2027-01-15', stageChangedAt: TODAY });
    expect(o.history.at(-1)).toMatchObject({ from: 'Negotiation', to: 'Proposal' });
    const fromNotes = Object.values(s.activities).filter(a => a.source === 'Notes via Claude').map(a => [a.type, a.subject, a.due, a.done, a.related.id, a.ownerId]);
    expect(fromNotes).toEqual(expect.arrayContaining([
      ['Visit', 'Met Aditi Kulkarni on the Pune scheme', TODAY, true, 'opp_sahyadri_pune', 'rep_rohan'],
      ['Task', 'Send revised quote to Aditi', '2026-10-16', false, 'opp_sahyadri_pune', 'rep_rohan'],
      ['Meeting', 'Meet consultant Vikram Joshi', '2026-10-19', false, 'opp_sahyadri_pune', 'rep_rohan'],
    ]));
    expect(fromNotes).toHaveLength(3);
  });

  test('opportunity review lists risks and next steps, adds one as a task, and drafts a follow-up email', async ({ app, page }) => {
    await app.open();
    await app.go('opportunities');
    await app.openRecord('opp_deccan_unit3');
    const d = app.drawer();
    await d.locator('[data-act="aiReview"]').click();
    const review = d.locator('.review');
    await expect(review.locator('.hrow b')).toHaveText('Health B, 60/100. Biggest drag: no next step scheduled.');
    await expect(review).toContainText('Quote QT/FY27/0007 carries 14% extra discount');
    const steps = review.locator('.na');
    await expect(steps).toHaveCount(2);
    await expect(steps.nth(0)).toContainText('Book the next meeting with Venkat');
    await expect(steps.nth(1)).toContainText('Trade the extra discount for volume or faster payment');

    await steps.nth(0).locator('[data-act="aiTask"]').click();
    await expect(toast(app, 'Task added for 15 Oct.')).toBeVisible();
    await expect(d.locator('.tl').last()).toContainText('Book the next meeting with Venkat');
    // The booked next step lifts health from 60 (B) to 80 (A).
    await expect(d.locator('.sec', { hasText: 'Opportunity health' }).locator('.hrow')).toContainText('Score 80');

    await d.locator('[data-act="aiMail"]').click();
    const mail = d.locator('#mail-opp_deccan_unit3');
    await expect(mail).toContainText('Subject: boiler feed pumps for Unit 3: next steps');
    await expect(mail).toContainText('Dear Venkat,');
    await expect(mail).toContainText('Our quotation QT/FY27/0007 for ₹4,85,251 including GST will reach you shortly, valid till 9 Nov 2026.');
    await expect(mail).toContainText('Next step from our side: book the next meeting with Venkat, planned for 15 Oct 2026.');
    await expect(mail).toContainText(/Regards,\s+Kavya Nair\s+Vardhan Flow Controls \(sample\)/);
    await expect(d.locator('[data-act="copyMail"]')).toBeVisible();

    const task = Object.values((await app.store()).data.activities).find(a => a.subject === 'Book the next meeting with Venkat');
    expect(task).toMatchObject({ type: 'Task', due: '2026-10-15', done: false, ownerId: 'rep_kavya', related: { kind: 'opp', id: 'opp_deccan_unit3' } });
  });

  test('asking the search bar which deals are at risk lists the biggest C and D deals and the pending approval', async ({ app, page }) => {
    await app.open();
    await page.locator('#cmd').fill('which deals are at risk?');
    const ask = page.locator('#cmd-drop [data-act="cmdAsk"]');
    await expect(ask).toContainText('Ask Claude: “which deals are at risk?”');
    await ask.click();
    const d = app.drawer();
    await expect(d.locator('.dh .eyebrow')).toHaveText('Ask Claude');
    await expect(d.locator('.dh h2')).toHaveText('which deals are at risk?');
    const out = d.locator('#ask-out');
    await expect(out).toContainText('Deals at risk:');
    await expect(out).toContainText('Q3 FY27: ₹9.5 L closed so far. The forecast call is ₹1.26 Cr against a quota of ₹1.70 Cr (74%).');
    await expect(out).toContainText('• Konkan — crude unit actuated valves, ₹75.0 L, health C: no logged activity for 20 days');
    await expect(out).toContainText('• Thar Solar — pump season stock, ₹22.0 L, health C: no logged activity for 24 days');
    await expect(out).toContainText('• Hooghly — purified water loop valves, ₹8.5 L, health C: no logged activity for 18 days');
    await expect(out).toContainText('Waiting for approval: QT/FY27/0007 (Deccan Process Engineering, needs sales manager).');
    await expect(d.locator('#ask-stop')).toHaveCount(0);
    await expect(page.locator('#cmd-drop')).toBeHidden();
  });
});

/* ---------- activities and forecast ---------- */
test.describe('activities and forecast', () => {
  test('log an activity against an opportunity, then mark another done and schedule the suggested follow-up', async ({ app, page }) => {
    await app.open();
    await app.go('activities');
    await page.locator('#view .page-h [data-act="logAct"]').click();
    await app.fill({ type: { select: 'Visit' }, due: '2026-10-15', subject: 'Plant visit: CIP line survey', ownerId: { select: 'rep_simran' }, oppId: { select: 'opp_indus_cip' }, notes: 'Walk the CIP skid with Gurpreet.' });
    await app.submit();
    await expect(toast(app, 'Activity saved.')).toBeVisible();
    const d = app.drawer();
    await expect(d.locator('.dh h2')).toHaveText('Indus Dairy — CIP line ball valves');
    await expect(d.locator('.tl li', { hasText: 'Plant visit: CIP line survey' })).toContainText('planned');

    await app.closeDrawer();
    const next7 = app.view().locator('h2.h2:has-text("Next 7 days") + .tw');
    const row = next7.locator('tr', { hasText: 'Plant visit: CIP line survey' });
    await expect(row).toContainText('Indus Dairy — CIP line ball valves');
    await expect(row).toContainText('Simran Gill');
    await expect(row).toContainText('15 Oct');

    await app.view().getByRole('checkbox', { name: 'Mark Confirm delivery schedule with Prakash done' }).click();
    const suggestion = toast(app, 'Done. Suggested next: Follow-up call on 20 Oct.');
    await expect(suggestion).toBeVisible();
    await suggestion.getByRole('button', { name: 'Schedule it' }).click();
    await expect(toast(app, 'Scheduled.')).toBeVisible();
    await expect(app.view().locator('tr', { hasText: 'Confirm delivery schedule with Prakash' })).toHaveCount(0);
    await page.locator('#view [data-act="seg"][data-k="actF"][data-v="done"]').click();
    await expect(app.view().locator('tr', { hasText: 'Confirm delivery schedule with Prakash' })).toHaveCount(1);

    const acts = (await app.store()).data.activities;
    expect(Object.values(acts).find(a => a.subject === 'Plant visit: CIP line survey')).toMatchObject({ type: 'Visit', due: '2026-10-15', ownerId: 'rep_simran', done: false, notes: 'Walk the CIP skid with Gurpreet.', related: { kind: 'opp', id: 'opp_indus_cip' }, createdAt: TODAY });
    expect(acts.act_01).toMatchObject({ done: true, doneAt: TODAY });
    expect(Object.values(acts).filter(a => a.subject === 'Follow-up call')).toEqual([expect.objectContaining({ type: 'Call', due: '2026-10-20', done: false, ownerId: 'rep_arjun', related: { kind: 'opp', id: 'opp_kaveri_drip' } })]);
  });

  test('saving a weekly snapshot makes it the new baseline for pipeline changes', async ({ app, page }) => {
    await app.open();
    await app.go('forecast');
    const panel = app.view().locator('section.panel', { hasText: 'compared with today' });
    await expect(panel).toContainText('Open Q3 FY27 pipeline on 6 Oct 2026 compared with today');
    await expect(panel.locator('tr[data-kind="opp"]')).toHaveCount(8);

    await page.locator('#view .page-h [data-act="snapshot"]').click();
    await expect(toast(app, 'Snapshot saved for 13 Oct 2026. Changes are measured from it.')).toBeVisible();
    await expect(panel).toContainText('Open Q3 FY27 pipeline on 13 Oct 2026 compared with today');
    await expect(panel.locator('tr[data-kind="opp"]')).toHaveCount(0);
    await expect(panel.locator('svg text', { hasText: '₹1.53 Cr' })).toHaveCount(2);

    // The sample snapshot (taken 6 Oct after the date shift) stays; the new one is keyed by quarter and today.
    const snaps = (await app.store()).data.snapshots;
    expect(Object.values(snaps).map(x => x.takenAt).sort()).toEqual(['2026-10-06', TODAY]);
    const snap = snaps[`FY27-Q3_${TODAY}`];
    expect(snap).toMatchObject({ quarter: 'FY27-Q3', takenAt: TODAY });
    expect(Object.keys(snap.opps)).toHaveLength(16);
    expect(snap.opps.opp_konkan_crude).toMatchObject({ amount: 7500000, stage: 'Requirement', open: true, closeDate: '2027-01-21' });
    expect(snap.opps.opp_coromandel_etp).toMatchObject({ stage: 'Won', open: false });
  });
});

/* ---------- settings, relationships, sample data ---------- */
test.describe('settings and relationships', () => {
  test('raising the manager approval threshold changes the approval a draft quote needs', async ({ app, page }) => {
    await app.open();
    const q = await draftQuoteFrom(app, page, 'opp_peenya_skid');
    await setExtraDiscount(app, 0, 12);
    await expect(app.drawer().locator('[data-act="qSubmit"]')).toHaveText('Submit for sales manager approval');
    await app.closeDrawer();

    await app.go('settings');
    await page.locator('#view [data-act="editSettings"]').click();
    await expect(page.locator('#drawer-body [name="managerAbove"]')).toHaveValue('10');
    await app.fill({ managerAbove: '15' });
    await app.submit();
    await expect(toast(app, 'Settings saved.')).toBeVisible();
    await expect(page.locator('#drawer')).toBeHidden();
    await expect(ddFor(app.view(), 'Manager approves extra discount above')).toHaveText('15%');

    await app.go('quotes');
    await expect(app.view().locator('.page-h .sub')).toContainText('extra discount above 15% needs a sales manager');
    await app.openRecord(q.id);
    const d = app.drawer();
    await expect(d).toContainText('No approval needed: the highest extra discount is 12%, within the 15% limit.');
    await expect(d.locator('[data-act="qSubmit"]')).toHaveText('Approve (within limits)');
    await d.locator('[data-act="qSubmit"]').click();
    await expect(toast(app, 'Approved. Every discount is within limits.')).toBeVisible();
    await expect(pill(app)).toHaveText('Approved');

    const s = (await app.store()).data;
    expect(s.settings.org).toMatchObject({ managerAbove: 15, directorAbove: 20, company: 'Vardhan Flow Controls (sample)' });
    expect(s.quotes[q.id]).toMatchObject({ status: 'Approved', approval: { level: 'None', status: 'Not needed', at: TODAY } });
  });

  test('a relationship between two accounts shows on both accounts and on the map', async ({ app, page }) => {
    await app.open();
    await app.go('relationships');
    await page.locator('#view .page-h [data-act="newRel"]').click();
    await app.fill({ from: { select: 'acc:acc_peenya' }, type: { select: 'supplies' }, to: { select: 'acc:acc_saurashtra' }, since: '2026-06-01', notes: 'Pump skids for the shutdown package.' });
    await app.submit();
    await expect(toast(app, 'Relationship saved.')).toBeVisible();
    const d = app.drawer();
    await expect(d.locator('.dh h2')).toHaveText('Peenya Fabricators');
    const rels = d.locator('.sec', { has: page.locator('h3', { hasText: 'Relationships' }) });
    const out = rels.locator('li', { hasText: 'Saurashtra Petrochem Services' });
    await expect(out.locator('.when')).toHaveText('Supplies');
    await expect(out).toContainText('since 1 Jun 2026');
    await expect(out).toContainText('Pump skids for the shutdown package.');

    await out.locator('a', { hasText: 'Saurashtra Petrochem Services' }).click();
    await expect(d.locator('.dh h2')).toHaveText('Saurashtra Petrochem Services');
    await expect(rels.locator('li', { hasText: 'Peenya Fabricators' }).locator('.when')).toHaveText('Buys from');

    await app.closeDrawer();
    await expect(app.view().locator('[data-act="editRel"]')).toHaveCount(13);
    await expect(app.view().locator('select[data-uisel="relFocus"]')).toHaveValue('acc:acc_peenya');
    await expect(app.view().locator('.relmap g[data-ref="acc:acc_saurashtra"]')).toContainText('Supplies');

    const rel = Object.values((await app.store()).data.relationships).find(r => r.fromId === 'acc_peenya' && r.toId === 'acc_saurashtra');
    expect(rel).toMatchObject({ fromKind: 'acc', toKind: 'acc', type: 'supplies', since: '2026-06-01', notes: 'Pump skids for the shutdown package.', createdAt: TODAY });
  });

  test('removing the sample data in Settings leaves an empty CRM', async ({ app, page }) => {
    await app.open();
    await app.go('settings');
    await expect(app.view()).toContainText('135 sample records for a fictional valve and pump maker');
    await page.locator('#view [data-act="deleteSample"]').click();
    await expect(page.locator('#modal-card h3')).toHaveText('Delete 135 sample records?');
    await page.locator('#modal-card [data-act="deleteSampleGo"]').click();
    await expect(toast(app, 'Deleted 135 sample records. Your CRM is ready for real data.')).toBeVisible();
    await expect(page).toHaveURL(/#home$/);
    const empty = app.view().locator('.empty');
    await expect(empty.locator('h2')).toHaveText('Your CRM is empty');
    await expect(empty.locator('.steps li')).toHaveCount(3);
    await expect(empty.locator('[data-act="newLead"]')).toBeVisible();
    await expect(page.locator('#brand-sub')).toHaveText('CRM for manufacturers');
    await expect(page.locator('#nav .count')).toHaveCount(0);

    const data = (await app.store()).data;
    for (const [coll, items] of Object.entries(data)) expect(Object.keys(items), coll).toEqual([]);

    await app.go('settings');
    await expect(app.view()).toContainText('No sample records left');
    await expect(page.locator('#view [data-act="deleteSample"]')).toBeDisabled();
    await app.go('leads');
    await expect(app.view().locator('.empty h2')).toHaveText('No leads here');
  });
});

/* ---------- demo storage ---------- */
test.describe('demo storage', () => {
  test('changes survive a reload, and Reset demo brings back the original sample', async ({ app, page }) => {
    await app.open();
    await app.go('leads');
    await page.locator('#view [data-act="newLead"]').first().click();
    await app.fill({ company: 'Hosur Pump House', state: { select: 'Tamil Nadu' }, industry: { select: 'Process plants' } });
    await app.submit();
    await expect(toast(app, 'Lead added and assigned to')).toBeVisible();
    await app.closeDrawer();
    await app.go('activities');
    await app.view().getByRole('checkbox', { name: 'Mark Confirm delivery schedule with Prakash done' }).click();
    await expect(toast(app, 'Done. Suggested next')).toBeVisible();

    await page.reload();
    await app.ready();
    await expect(app.view().locator('.page-h h1').first()).toHaveText('Activities');
    await expect(app.view().locator('tr', { hasText: 'Confirm delivery schedule with Prakash' })).toHaveCount(0);
    await app.go('leads');
    await expect(app.view().locator('tr[data-kind="lead"]', { hasText: 'Hosur Pump House' })).toHaveCount(1);
    let s = await app.store();
    expect(s.seededFor).toBe(TODAY);
    expect(s.data.activities.act_01.done).toBe(true);

    await page.locator('#view .banner.demo [data-act="demoReset"]').click();
    await expect(toast(app, 'Demo reset to the original sample data.')).toBeVisible();
    await expect(app.view().locator('tr[data-kind="lead"]', { hasText: 'Hosur Pump House' })).toHaveCount(0);
    await expect(app.view().locator('tr[data-kind="lead"]')).toHaveCount(9);
    await app.go('activities');
    await expect(app.view().locator('tr', { hasText: 'Confirm delivery schedule with Prakash' })).toHaveCount(1);
    s = await app.store();
    expect(Object.keys(s.data.leads)).toHaveLength(10);
    expect(Object.values(s.data.leads).some(l => l.company === 'Hosur Pump House')).toBe(false);
    expect(s.data.activities.act_01).toMatchObject({ done: false, due: '2026-10-15' });
  });
});

/* ---------- mobile ---------- */
test.describe('mobile 390 × 844', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('no view scrolls sideways and the record drawer fits the screen', async ({ app, page }) => {
    await app.open();
    const sideways = () => page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
    for (const view of VIEWS) {
      await app.go(view);
      await expect(app.view().locator('.page-h h1').first()).toBeVisible();
      const w = await sideways();
      expect.soft(w.scroll, `${view}: page is ${w.scroll}px wide on a ${w.client}px screen`).toBeLessThanOrEqual(w.client);
    }

    const fits = async label => {
      const sheet = page.locator('#drawer .sheet');
      await expect(sheet).toBeVisible();
      await sheet.evaluate(el => Promise.all(el.getAnimations().map(a => a.finished))); // the panel slides in from 24px right
      const box = await sheet.boundingBox();
      expect.soft(box.x, `${label}: drawer left edge`).toBeGreaterThanOrEqual(0);
      expect.soft(box.x + box.width, `${label}: drawer right edge`).toBeLessThanOrEqual(390);
      expect.soft(box.height, `${label}: drawer height`).toBeLessThanOrEqual(844);
      const body = await page.locator('#drawer-body').evaluate(el => ({ scroll: el.scrollWidth, client: el.clientWidth }));
      expect.soft(body.scroll, `${label}: drawer content is ${body.scroll}px wide in a ${body.client}px panel`).toBeLessThanOrEqual(body.client);
    };
    await app.go('opportunities');
    await app.openRecord('opp_sahyadri_pune');
    await fits('opportunity');
    await app.closeDrawer();
    await app.go('quotes');
    await app.openRecord('qt_0005b');
    await page.locator('#drawer-body [data-act="qDoc"]').click();
    await expect(page.locator('#drawer-body .qdoc')).toBeVisible();
    await fits('quote with customer copy');
  });
});

/* ---------- portfolio ---------- */
test.describe('portfolio', () => {
  test('JSON-LD lists five products with Molbhav at /molbhav/, and the sitemap lists the demo', async ({ page, request }) => {
    await page.goto('/');
    const ld = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
    const list = ld['@graph'].find(n => n['@type'] === 'ItemList');
    expect(list.numberOfItems).toBe(5);
    expect(list.itemListElement.map(e => e.position)).toEqual([1, 2, 3, 4, 5]);
    const names = list.itemListElement.map(e => e.item.name);
    expect(names).toEqual(['Duely', 'Roamly', 'Tailor', 'Opportunity Hunter', 'Molbhav']);
    const molbhav = list.itemListElement[4].item;
    expect(molbhav.url).toBe('https://panshulbh16.github.io/molbhav/');
    expect(molbhav.screenshot).toBe('https://panshulbh16.github.io/assets/img/molbhav.png');
    await expect(page.locator('.card h3')).toHaveText(names);
    const cardPath = await page.locator('#molbhav-title ~ .card-actions .visit').evaluate(a => new URL(a.href).pathname);
    expect(cardPath).toBe(new URL(molbhav.url).pathname);

    const sitemap = await request.get('/sitemap.xml');
    expect(sitemap.status()).toBe(200);
    const locs = [...(await sitemap.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim());
    expect(locs).toContain('https://panshulbh16.github.io/molbhav/');
    expect((await request.get(cardPath)).status()).toBe(200);
  });

  test('every product card image loads', async ({ page }) => {
    await page.goto('/');
    const imgs = page.locator('.card img');
    await expect(imgs).toHaveCount(5);
    for (let i = 0; i < 5; i++) {
      const img = imgs.nth(i);
      await img.scrollIntoViewIfNeeded();
      await expect.poll(() => img.evaluate(el => (el.complete ? el.naturalWidth : 0)), { message: `card image ${i + 1} should load` }).toBeGreaterThan(0);
    }
  });
});
