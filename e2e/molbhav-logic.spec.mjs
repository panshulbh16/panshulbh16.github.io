// Business-logic tests for Molbhav, run against the app's own functions through window.__molbhav.
// The clock is fixed at 13 Oct 2026 12:00 IST (FY27-Q3) and the sample data is shifted +1 day
// from its 12 Oct anchor, so every expected number below is worked out from apps/molbhav/seed/all.json.
// Tests tagged @negative feed invalid, empty, malformed, boundary or hostile input.
import { test, expect } from './fixtures.mjs';

test.beforeEach(async ({ app }) => app.open());

test.describe('fyq: Indian financial-year quarters', () => {
  test('1 Apr opens Q1 of the new financial year and 30 Jun closes it @negative', async ({ app }) => {
    const r = await app.logic(m => ({ apr1: m.fyq('2026-04-01'), jun30: m.fyq('2026-06-30'), jul1: m.fyq('2026-07-01'), cur: m.CURQ }));
    expect(r.apr1).toEqual({ key: 'FY27-Q1', fy: 'FY27', label: 'Q1 FY27', months: ['2026-04', '2026-05', '2026-06'], start: '2026-04-01', end: '2026-06-30', range: 'Apr–Jun 2026' });
    expect(r.jun30).toEqual(r.apr1);
    expect(r.jul1).toMatchObject({ key: 'FY27-Q2', start: '2026-07-01', end: '2026-09-30' });
    expect(r.cur).toMatchObject({ key: 'FY27-Q3', start: '2026-10-01', end: '2026-12-31', months: ['2026-10', '2026-11', '2026-12'] });
  });

  test('1 Jan opens Q4 and 31 Mar closes it, in the year that began the previous April @negative', async ({ app }) => {
    const r = await app.logic(m => ({ jan1: m.fyq('2027-01-01'), mar31: m.fyq('2027-03-31'), dec31: m.fyq('2026-12-31'), prevMar31: m.fyq('2026-03-31'), leap: m.fyq('2028-02-29') }));
    expect(r.jan1).toEqual({ key: 'FY27-Q4', fy: 'FY27', label: 'Q4 FY27', months: ['2027-01', '2027-02', '2027-03'], start: '2027-01-01', end: '2027-03-31', range: 'Jan–Mar 2027' });
    expect(r.mar31).toEqual(r.jan1);
    expect(r.dec31).toMatchObject({ key: 'FY27-Q3', end: '2026-12-31' });
    expect(r.prevMar31).toMatchObject({ key: 'FY26-Q4', fy: 'FY26', start: '2026-01-01', end: '2026-03-31' });
    expect(r.leap).toMatchObject({ key: 'FY28-Q4', start: '2028-01-01', end: '2028-03-31' });
  });
});

test.describe('inWords: amount in words for the quotation', () => {
  test('zero, an exact lakh and an exact crore read without filler @negative', async ({ app }) => {
    const r = await app.logic(m => [0, 0.5, 100000, 2500000, 10000000].map(m.inWords));
    expect(r).toEqual([
      'Rupees Zero Only',
      'Rupees Zero and Fifty Paise Only',
      'Rupees One Lakh Only',
      'Rupees Twenty Five Lakh Only',
      'Rupees One Crore Only',
    ]);
  });

  test('crore amounts with paise and very large totals use the Indian system', async ({ app }) => {
    const r = await app.logic(m => [12345678.9, 100000.01, 3068000, 9876543210, 1e12].map(m.inWords));
    expect(r).toEqual([
      'Rupees One Crore Twenty Three Lakh Forty Five Thousand Six Hundred Seventy Eight and Ninety Paise Only',
      'Rupees One Lakh and One Paise Only',
      'Rupees Thirty Lakh Sixty Eight Thousand Only',
      'Rupees Nine Hundred Eighty Seven Crore Sixty Five Lakh Forty Three Thousand Two Hundred Ten Only',
      'Rupees One Lakh Crore Only',
    ]);
  });

  test('amounts that round up to a whole rupee, or are negative, still read as words @negative', async ({ app }) => {
    const r = await app.logic(m => {
      const safe = x => { try { return m.inWords(x); } catch (e) { return `THREW ${e.message}`; } };
      return { up: safe(99.999), tiny: safe(0.999), neg: safe(-1500) };
    });
    expect.soft(r.up, '₹99.999 is ₹100.00').toBe('Rupees One Hundred Only');
    expect.soft(r.tiny, '₹0.999 is ₹1.00').toBe('Rupees One Only');
    expect.soft(r.neg, 'a negative amount must not crash the page').not.toMatch(/^THREW/);
    expect.soft(r.neg).toContain('One Thousand Five Hundred');
    for (const s of Object.values(r)) expect.soft(s).not.toContain('undefined');
  });
});

test.describe('gstinCheck: GSTIN format and state code', () => {
  test('a well-formed GSTIN passes for its own state and when no state is given', async ({ app }) => {
    const r = await app.logic(m => [
      m.gstinCheck('29AABCV6631N1Z4', 'Karnataka'),
      m.gstinCheck('27AAGCS2290R1Z9', 'Maharashtra'),
      m.gstinCheck('24AAJCS9045P1Z1', 'Gujarat'),
      m.gstinCheck('29AABCV6631N1Z4', ''),
    ]);
    expect(r).toEqual(['', '', '', '']);
  });

  test('a GSTIN from another state is rejected with both state codes named @negative', async ({ app }) => {
    const r = await app.logic(m => [m.gstinCheck('27AAGCS2290R1Z9', 'Karnataka'), m.gstinCheck('29AABCV6631N1Z4', 'Tamil Nadu')]);
    expect(r).toEqual(['GSTIN starts with 27, but Karnataka is 29', 'GSTIN starts with 29, but Tamil Nadu is 33']);
  });

  test('wrong length or characters are rejected, lowercase is normalised and empty means not given @negative', async ({ app }) => {
    const r = await app.logic(m => ({
      bad: ['29AABCV6631N1Z', '29AABCV6631N1Z44', '29AABCV66O1N1Z4', '29AABCV6631N0Z4', '29AABCV6631N1Y4', '29AABCV 6631N1Z', '29AABCV6631N1Z@', 'ABCDEFGHIJKLMNO'].map(g => m.gstinCheck(g, 'Karnataka')),
      lower: [m.gstinCheck('29aabcv6631n1z4', 'Karnataka'), m.gstinCheck('  27aagcs2290r1z9 ', 'Maharashtra'), m.gstinCheck('27aagcs2290r1z9', 'Karnataka')],
      empty: [m.gstinCheck('', 'Karnataka'), m.gstinCheck(null, 'Karnataka'), m.gstinCheck(undefined)],
    }));
    for (const msg of r.bad) expect(msg).toBe('GSTIN format looks wrong: 15 characters, starting with the 2-digit state code');
    expect(r.lower).toEqual(['', '', 'GSTIN starts with 27, but Karnataka is 29']);
    expect(r.empty).toEqual([null, null, null]);
  });
});

test.describe('priceFor: price lists, slabs and schemes', () => {
  test('the best rule of each kind applies once and tier, slab and promo compound', async ({ app }) => {
    const r = await app.logic(m => {
      const p = (pid, acc, qty, date) => { const x = m.priceFor(pid, m.one('accounts', acc), qty, date); return { list: x.list, pct: x.ruleDiscountPct, unit: x.unit, notes: x.notes }; };
      return {
        distValves: p('prd_bv050', 'acc_kaveri', 120),
        dealerPumps: p('prd_cp075', 'acc_narmada', 200),
        dealerValves: p('prd_bv050', 'acc_narmada', 10),
        dealerPumpsAfterSchemes: p('prd_cp075', 'acc_narmada', 200, '2027-02-01'),
        direct: p('prd_bv050', 'acc_sahyadri', 10),
      };
    });
    // Distributor 22% then slab 50+ 3%: 1 - 0.78 x 0.97 = 24.34%
    expect(r.distValves).toEqual({ list: 6850, pct: 24.34, unit: 5182.71, notes: ['Distributor price list −22%', 'Volume slab 50+ −3%'] });
    // Dealer 15%, slab 200+ (5%) beats 50+ (3%), pump launch (4%) beats Diwali (3%): 1 - 0.85 x 0.95 x 0.96 = 22.48%
    expect(r.dealerPumps).toEqual({ list: 68500, pct: 22.48, unit: 53101.2, notes: ['Dealer price list −15%', 'Volume slab 200+ −5%', 'Pump launch offer −4%'] });
    // Valves are not pumps, so the Diwali dealer scheme is the promo: 1 - 0.85 x 0.97 = 17.55%
    expect(r.dealerValves).toEqual({ list: 6850, pct: 17.55, unit: 5647.83, notes: ['Dealer price list −15%', 'Diwali dealer scheme −3%'] });
    // After both schemes expire only tier and slab remain: 1 - 0.85 x 0.95 = 19.25%
    expect(r.dealerPumpsAfterSchemes).toEqual({ list: 68500, pct: 19.25, unit: 55313.75, notes: ['Dealer price list −15%', 'Volume slab 200+ −5%'] });
    expect(r.direct).toEqual({ list: 6850, pct: 0, unit: 6850, notes: [] });
  });

  test('quantity slabs switch on exactly at 50 and 200 @negative', async ({ app }) => {
    const r = await app.logic(m => [1, 49, 50, 199, 200, 5000].map(q => { const x = m.priceFor('prd_bv050', m.one('accounts', 'acc_sahyadri'), q); return [q, x.ruleDiscountPct, x.unit]; }));
    expect(r).toEqual([[1, 0, 6850], [49, 0, 6850], [50, 3, 6644.5], [199, 3, 6644.5], [200, 5, 6507.5], [5000, 5, 6507.5]]);
  });

  test('an unknown product has no price and junk quantities never earn a slab or a negative price @negative', async ({ app }) => {
    const r = await app.logic(m => ({
      unknown: [m.priceFor('prd_ghost', m.one('accounts', 'acc_kaveri'), 10), m.priceFor('', null, 10), m.priceFor(undefined)],
      junk: ['abc', -60, null, NaN].map(q => { const x = m.priceFor('prd_bv050', null, q); return [x.ruleDiscountPct, x.unit, x.notes.length]; }),
    }));
    expect(r.unknown).toEqual([null, null, null]);
    for (const row of r.junk) expect(row).toEqual([0, 6850, 0]);
  });
});

test.describe('quoteCalc: GST and discount approval', () => {
  test('intra-state supply splits GST into equal CGST and SGST, inter-state charges IGST', async ({ app }) => {
    const r = await app.logic(m => {
      const lines = [
        { productId: 'prd_x', qty: 3, listPrice: 10000, ruleDiscountPct: 0, extraDiscountPct: 0, gstRate: 18 },
        { productId: 'prd_y', qty: 10, listPrice: 1850, ruleDiscountPct: 0, extraDiscountPct: 0, gstRate: 5 },
      ];
      const pick = c => ({ taxable: c.taxable, cgst: c.cgst, sgst: c.sgst, igst: c.igst, total: c.total, intra: c.intra, level: c.level });
      return { ka: pick(m.quoteCalc({ placeOfSupply: 'Karnataka', lines })), mh: pick(m.quoteCalc({ placeOfSupply: 'Maharashtra', lines })), seeded: pick(m.quoteCalc(m.one('quotes', 'qt_0005b'))) };
    });
    // Seller is in Karnataka. 30,000 @18% + 18,500 @5% = 5,400 + 925 GST.
    expect(r.ka).toEqual({ taxable: 48500, cgst: 3162.5, sgst: 3162.5, igst: 0, total: 54825, intra: true, level: 'None' });
    expect(r.mh).toEqual({ taxable: 48500, cgst: 0, sgst: 0, igst: 6325, total: 54825, intra: false, level: 'None' });
    // QT/FY27/0005 v2 to Maharashtra: 40 x 38,600 less 8% + 80 x 15,200 less 3% = 26,00,000; IGST 18% = 4,68,000.
    expect(r.seeded).toEqual({ taxable: 2600000, cgst: 0, sgst: 0, igst: 468000, total: 3068000, intra: false, level: 'None' });
  });

  test('approval is needed only above 10% (manager) and above 20% (director) @negative', async ({ app }) => {
    const r = await app.logic(m => {
      const level = (...extras) => m.quoteCalc({ placeOfSupply: 'Karnataka', lines: extras.map(x => ({ qty: 1, listPrice: 1000, gstRate: 18, extraDiscountPct: x })) });
      return {
        levels: [0, 10, 10.5, 20, 20.5, 60].map(x => [x, level(x).level]),
        mixed: (({ maxExtra, level: l }) => ({ maxExtra, level: l }))(level(5, 0, 21, 12)),
        superseded: m.quoteCalc(m.one('quotes', 'qt_0005a')).level,
      };
    });
    expect(r.levels).toEqual([[0, 'None'], [10, 'None'], [10.5, 'Sales manager'], [20, 'Sales manager'], [20.5, 'Director'], [60, 'Director']]);
    expect(r.mixed).toEqual({ maxExtra: 21, level: 'Director' });
    expect(r.superseded).toBe('Sales manager');
  });

  test('a quote with no lines totals zero and needs no approval @negative', async ({ app }) => {
    const r = await app.logic(m => [{ placeOfSupply: 'Karnataka', lines: [] }, {}, { lines: null }].map(q => {
      const c = m.quoteCalc(q);
      return { lines: c.lines.length, taxable: c.taxable, cgst: c.cgst, sgst: c.sgst, igst: c.igst, total: c.total, maxExtra: c.maxExtra, level: c.level };
    }));
    for (const c of r) expect(c).toEqual({ lines: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0, maxExtra: 0, level: 'None' });
  });

  test('CGST and SGST are each 9% of the taxable value, rounded to the paisa @negative', async ({ app }) => {
    const r = await app.logic(m => {
      const line = { productId: 'prd_x', qty: 7, listPrice: 1234.56, ruleDiscountPct: 7.5, extraDiscountPct: 2.5, gstRate: 18 };
      const ka = m.quoteCalc({ placeOfSupply: 'Karnataka', lines: [line] });
      const kl = m.quoteCalc({ placeOfSupply: 'Kerala', lines: [line] });
      const small = m.quoteCalc({ placeOfSupply: 'Karnataka', lines: [{ qty: 1, listPrice: 1000.03, gstRate: 18 }] });
      return { unit: ka.lines[0].unit, value: ka.lines[0].value, ka: [ka.taxable, ka.cgst, ka.sgst, ka.total], kl: [kl.igst, kl.total], small: [small.cgst, small.sgst, small.total] };
    });
    // 1,234.56 x 0.925 x 0.975 = 1,113.4188 -> 1,113.42 a unit; x 7 = 7,793.94.
    expect(r.unit).toBe(1113.42);
    expect(r.value).toBe(7793.94);
    // IGST 18% = 1,402.9092 -> 1,402.91.
    expect(r.kl).toEqual([1402.91, 9196.85]);
    // CGST = SGST = 9% of 7,793.94 = 701.4546 -> 701.45 each.
    expect.soft(r.ka, 'taxable, CGST, SGST, total').toEqual([7793.94, 701.45, 701.45, 9196.84]);
    // 9% of 1,000.03 = 90.0027 -> 90.00 each.
    expect.soft(r.small, 'CGST, SGST, total on 1,000.03').toEqual([90, 90, 1180.03]);
  });
});

test.describe('leadScore: lead scoring', () => {
  test('a referred, detailed, target-industry lead with a valid GSTIN scores 100 and is Hot', async ({ app }) => {
    const r = await app.logic(m => m.leadScore({
      company: 'Hosur Agri Pumps', source: 'Referral', industry: 'Water & irrigation', turnoverBand: '₹100 Cr+',
      state: 'Karnataka', gstin: '29AAHFN4410K1Z2', createdAt: m.TODAY,
      requirement: '120 butterfly valves 6 inch and 40 ball valves for the Mandya canal project',
    }));
    expect(r.band).toBe('Hot');
    expect(r.score).toBe(100);
    expect(r.factors.map(f => f[1])).toEqual([20, 20, 15, 10, 20, 15]);
    expect(r.factors[3][0]).toBe('Valid GSTIN for the state');
  });

  test('an empty lead is Cold with zero points and a GSTIN from another state earns no GSTIN points @negative', async ({ app }) => {
    const r = await app.logic(m => {
      const base = { source: 'Website', industry: 'Pharma', turnoverBand: '₹5–25 Cr', state: 'Karnataka', requirement: 'Valves', createdAt: m.TODAY };
      return { empty: m.leadScore({}), right: m.leadScore({ ...base, gstin: '29AAHFN4410K1Z2' }), wrong: m.leadScore({ ...base, gstin: '27AAGCS2290R1Z9' }), junk: m.leadScore({ ...base, gstin: '29-NOT-A-GSTIN' }) };
    });
    expect(r.empty.score).toBe(0);
    expect(r.empty.band).toBe('Cold');
    expect(r.empty.factors.every(f => f[1] === 0)).toBe(true);
    expect(r.empty.factors[3][0]).toBe('No GSTIN yet');
    expect(r.right.factors[3]).toEqual(['Valid GSTIN for the state', 10, 10]);
    expect(r.wrong.factors[3]).toEqual(['GSTIN doesn’t match the state', 0, 10]);
    expect(r.junk.factors[3][1]).toBe(0);
    expect(r.right.score - r.wrong.score).toBe(10);
  });
});

test.describe('territoryFor and assignLead: lead routing', () => {
  test('leads route by state and industry to the rep with the fewest open leads', async ({ app }) => {
    const r = await app.logic(m => ({
      terr: [['Karnataka', 'Pharma'], ['Maharashtra', 'Oil & gas'], ['Maharashtra', 'Textiles'], ['Gujarat', 'Oil & gas'], ['Odisha', 'Process plants']].map(([s, i]) => m.territoryFor(s, i).id),
      southTie: m.assignLead('Karnataka', 'Water & irrigation'),
      southFewest: m.assignLead('Karnataka', 'Water & irrigation', 'lead_nandi'),
      west: m.assignLead('Maharashtra', 'Textiles').ownerId,
      key: m.assignLead('Gujarat', 'Oil & gas').ownerId,
    }));
    expect(r.terr).toEqual(['ter_south', 'ter_key', 'ter_west', 'ter_key', 'ter_rest']);
    // Arjun and Kavya each hold one New/Working lead; the tie goes alphabetically.
    expect(r.southTie).toEqual({ ownerId: 'rep_arjun', territoryId: 'ter_south', note: 'South: Arjun Rao had the fewest open leads (1 of 25).' });
    // Leaving out Kavya's own lead (re-assignment), she has none open.
    expect(r.southFewest).toEqual({ ownerId: 'rep_kavya', territoryId: 'ter_south', note: 'South: Kavya Nair had the fewest open leads (0 of 20).' });
    expect(r.west).toBe('rep_rohan');
    expect(r.key).toBe('rep_farhan');
  });

  test('an unmapped state falls back to the catch-all, and no territory or full capacity leaves the lead unassigned @negative', async ({ app }) => {
    const r = await app.logic(m => {
      const out = { unmapped: [m.territoryFor('Atlantis', 'Pharma').id, m.territoryFor('', '').id, m.territoryFor(undefined, undefined).id] };
      m.S.reps.rep_rohan.capacity = 4;
      out.oneSlotLeft = m.assignLead('Rajasthan', 'Textiles').ownerId;
      m.S.reps.rep_rohan.capacity = 3;
      out.full = m.assignLead('Rajasthan', 'Textiles');
      delete m.S.territories.ter_rest;
      out.noTerritory = [m.territoryFor('Odisha', 'Pharma'), m.assignLead('Odisha', 'Pharma')];
      return out;
    });
    expect(r.unmapped).toEqual(['ter_rest', 'ter_rest', 'ter_rest']);
    expect(r.oneSlotLeft).toBe('rep_rohan');
    expect(r.full).toEqual({ ownerId: null, territoryId: 'ter_west', note: 'Everyone in West is at their lead capacity.' });
    expect(r.noTerritory).toEqual([null, { ownerId: null, territoryId: null, note: 'No territory matched this state. Add one in Territories.' }]);
  });
});

test.describe('health: opportunity health score', () => {
  test('a won or lost opportunity has no score or grade', async ({ app }) => {
    const r = await app.logic(m => ['opp_coromandel_etp', 'opp_kaveri_hbl', 'opp_malabar_tender'].map(id => m.health(m.one('opps', id))));
    for (const h of r) expect(h).toEqual({ score: null, grade: null, factors: [] });
  });

  test('a close date in the past costs 25 points, a close date of today costs nothing @negative', async ({ app }) => {
    const r = await app.logic(m => {
      const o = m.one('opps', 'opp_sahyadri_pune');
      const h = closeDate => m.health(Object.assign({}, o, { closeDate }));
      return { future: h(o.closeDate), today: h(m.TODAY), past: h('2026-10-01'), yesterday: h('2026-10-12') };
    });
    expect(r.future).toMatchObject({ score: 70, grade: 'B' });
    expect(r.today).toMatchObject({ score: 70, grade: 'B' });
    expect(r.today.factors.some(f => /Close date/.test(f.text))).toBe(false);
    expect(r.past).toMatchObject({ score: 45, grade: 'C' });
    expect(r.past.factors[0]).toEqual({ pts: -25, text: 'Close date passed 12 days ago' });
    expect(r.yesterday.score).toBe(45);
    expect.soft(r.yesterday.factors[0].text).toBe('Close date passed 1 day ago');
  });
});

test.describe('marginCalc: quote margin', () => {
  test('margin before and after the extra discount, and what the discount gives away', async ({ app }) => {
    const r = await app.logic(m => m.marginCalc(m.one('quotes', 'qt_0007')));
    // 6 pumps at 68,500 less 13.6% (59,184), then 14% extra (50,898.24); 12 check valves at 9,800 less 10% (8,820).
    expect(r).toMatchObject({ rev0: 460944, rev: 411229.44, cost: 343200, giveaway: 49714.56, missing: 0, lines: 2 });
    expect(r.margin0).toBeCloseTo(117744 / 460944, 9);
    expect(r.margin).toBeCloseTo(68029.44 / 411229.44, 9);
    expect(r.margin).toBeLessThan(r.margin0);
  });

  test('lines without a standard cost are counted as missing and an empty quote has no margin @negative', async ({ app }) => {
    const r = await app.logic(m => {
      delete m.S.products.prd_sk001.cost;
      const q = { placeOfSupply: 'Karnataka', lines: [
        { productId: 'prd_bv050', qty: 10, listPrice: 6850, gstRate: 18 },
        { productId: 'prd_ghost', qty: 5, listPrice: 1000, gstRate: 18 },
        { productId: 'prd_sk001', qty: 20, listPrice: 1850, gstRate: 18 },
      ] };
      return { some: m.marginCalc(q), none: m.marginCalc({ lines: [] }) };
    });
    expect(r.some).toMatchObject({ missing: 2, lines: 3, cost: 41000, rev: 110500, rev0: 110500, giveaway: 0 });
    expect(r.none).toEqual({ rev: 0, rev0: 0, cost: 0, giveaway: 0, margin: null, margin0: null, missing: 0, lines: 0 });
  });
});

test.describe('demoShift: keeping the demo dated to today', () => {
  test('dates move by days, months by months and FY quarters by quarters, in values and keys', async ({ app }) => {
    const r = await app.logic(m => ({
      fwd: m.demoShift({
        d: '2026-07-01', yearEnd: '2025-12-31', ym: '2026-07', ymWrap: '2025-11', q: 'FY27-Q2', qWrap: 'FY26-Q4',
        ts: '2026-07-01T10:30:00Z', local: '2026-07-01T09:05', arr: ['2026-06-30', 'FY27-Q4'],
        byMonth: { '2026-07': 5 }, byQuarter: { 'FY27-Q2': { amount: 1 } },
      }, '2026-07-13'),
      back: m.demoShift({ d: '2026-10-01', ym: '2026-10' }, '2026-10-14'),
    }));
    // 13 Jul -> 13 Oct is 92 days, 3 months and 1 quarter.
    expect(r.fwd).toEqual({
      d: '2026-10-01', yearEnd: '2026-04-02', ym: '2026-10', ymWrap: '2026-02', q: 'FY27-Q3', qWrap: 'FY27-Q1',
      ts: '2026-10-01T10:30:00Z', local: '2026-10-01T09:05', arr: ['2026-09-30', 'FY28-Q1'],
      byMonth: { '2026-10': 5 }, byQuarter: { 'FY27-Q3': { amount: 1 } },
    });
    expect(r.back).toEqual({ d: '2026-09-30', ym: '2026-10' });
  });

  test('unrelated strings, numbers, booleans and nulls are never touched @negative', async ({ app }) => {
    const r = await app.logic(m => {
      const same = { d: '2026-07-01' };
      return {
        identity: m.demoShift(same, m.TODAY) === same,
        out: m.demoShift({ s: 'hello', quote: 'QT/FY27/0001', badQ: 'FY27-Q5', digits: '202607', n: 42, f: 0.5, b: true, z: null, empty: '', list: [7, 'Pune'], keys: { FY27: 1, 'notes 2026-07': 2 } }, '2026-07-13'),
      };
    });
    expect(r.identity).toBe(true);
    expect(r.out).toEqual({ s: 'hello', quote: 'QT/FY27/0001', badQ: 'FY27-Q5', digits: '202607', n: 42, f: 0.5, b: true, z: null, empty: '', list: [7, 'Pune'], keys: { FY27: 1, 'notes 2026-07': 2 } });
  });
});

test.describe('AI output normalisers', () => {
  test('normalizeReview turns null and wrong types into a safe, capped review @negative', async ({ app }) => {
    const r = await app.logic(m => ({
      nul: m.normalizeReview(null),
      str: m.normalizeReview('not json'),
      odd: m.normalizeReview({
        grade: 'b+', headline: 42, risks: 'not a list',
        nextActions: [{ action: 'Call Prakash', dueInDays: -5 }, { action: 'Send samples', why: 7, dueInDays: 999 }, { action: 'Book visit', dueInDays: 'soon' }, { action: 'Fourth', dueInDays: 2 }],
      }),
      badGrade: m.normalizeReview({ grade: 'Z', risks: ['a', 'b', 'c', 'd'] }),
    }));
    const empty = { grade: null, headline: '', risks: [], nextActions: [] };
    expect(r.nul).toEqual(empty);
    expect(r.str).toEqual(empty);
    expect(r.odd).toEqual({
      grade: 'B', headline: '42', risks: [],
      nextActions: [{ action: 'Call Prakash', why: '', dueInDays: 0 }, { action: 'Send samples', why: '7', dueInDays: 60 }, { action: 'Book visit', why: '', dueInDays: 3 }],
    });
    expect(r.badGrade.grade).toBeNull();
    expect(r.badGrade.risks.map(x => x.risk)).toEqual(['a', 'b', 'c']);
  });

  test('normalizeReview drops blank or non-text risks and actions instead of showing "[object Object]" @negative', async ({ app }) => {
    const r = await app.logic(m => m.normalizeReview({
      grade: 'A',
      risks: [{ risk: 'Credit 62% used', evidence: 'outstanding ₹31 L' }, null, {}, { risk: '', evidence: 'evidence only' }],
      nextActions: [{}, { action: '', why: 'reason only' }, 'Send revised quote'],
    }));
    expect.soft(r.risks).toEqual([{ risk: 'Credit 62% used', evidence: 'outstanding ₹31 L' }]);
    expect.soft(r.nextActions).toEqual([{ action: 'Send revised quote', why: '', dueInDays: 3 }]);
    expect.soft(JSON.stringify(r)).not.toContain('[object Object]');
  });

  test('normalizeNotes ignores unknown records, invalid stages, past due dates and bad discounts @negative', async ({ app }) => {
    const r = await app.logic(m => ({
      nul: m.normalizeNotes(null),
      unknown: m.normalizeNotes({ oppId: 'opp_ghost', accountId: 'acc_ghost' }),
      odd: m.normalizeNotes({
        oppId: 'opp_ghost', accountId: 'acc_kaveri', summary: null,
        log: { type: 'Task', subject: 'x'.repeat(300) },
        stage: { to: 'Closed won' }, closeDate: { to: '15/11/2026' },
        next: [{ type: 'Fax', subject: 'Call Aditi', due: '2020-01-01' }, { subject: '', due: '2026-10-20' }, null, { type: 'Call', subject: 'Send drawings', due: '2026-10-20' }, { type: 'Visit', subject: 'Site visit', due: '2026-10-21' }],
        discountAsk: { pct: '-5' }, risks: 'none',
      }),
      fixed: m.normalizeNotes({ oppId: 'opp_deccan_unit3', stage: { to: 'Negotiation' }, closeDate: { to: '2026-10-31' }, discountAsk: { pct: 95, item: 123 } }, 'opp_kaveri_drip'),
      nanAsk: m.normalizeNotes({ stage: 'Won', discountAsk: { pct: 'abc' } }, 'opp_kaveri_drip'),
    }));
    expect(r.nul).toEqual({ oppId: '', accountId: '', summary: '', log: null, stage: null, closeDate: null, next: [], discountAsk: null, risks: [] });
    expect(r.unknown).toMatchObject({ oppId: '', accountId: '' });
    expect(r.odd).toEqual({
      oppId: '', accountId: 'acc_kaveri', summary: '',
      log: { type: 'Visit', subject: 'x'.repeat(120), notes: '' },
      stage: null, closeDate: null,
      next: [{ type: 'Task', subject: 'Call Aditi', due: '2026-10-15' }, { type: 'Call', subject: 'Send drawings', due: '2026-10-20' }, { type: 'Visit', subject: 'Site visit', due: '2026-10-21' }],
      discountAsk: null, risks: [],
    });
    // The fixed opportunity wins over the one Claude named; no-op stage and close date changes are dropped.
    expect(r.fixed).toMatchObject({ oppId: 'opp_kaveri_drip', accountId: 'acc_kaveri', stage: null, closeDate: null, discountAsk: { pct: 60, item: '123' } });
    expect(r.nanAsk).toMatchObject({ stage: null, discountAsk: null });
  });

  test('normalizeNotes rejects impossible calendar dates @negative', async ({ app }) => {
    const r = await app.logic(m => m.normalizeNotes({
      closeDate: { to: '2026-11-31', reason: 'PO in end November' },
      next: [{ type: 'Visit', subject: 'Plant visit', due: '2026-13-45' }],
    }, 'opp_kaveri_drip'));
    // 31 Nov and month 13 do not exist: no close-date change, and the task falls back to two days from today.
    expect.soft(r.closeDate).toBeNull();
    expect.soft(r.next).toEqual([{ type: 'Visit', subject: 'Plant visit', due: '2026-10-15' }]);
  });

  test('normalizeBoq handles unknown SKUs, negative or non-numeric quantities and junk items @negative', async ({ app }) => {
    const r = await app.logic(m => ({
      nul: m.normalizeBoq(null),
      wrong: m.normalizeBoq({ customer: 'Kaveri Agro', items: 'x', skipped: 'y', readability: 'excellent' }),
      boq: m.normalizeBoq({
        customer: 'Kaveri Agro Systems', project: 7, readability: 'good', skipped: ['Air release valve 25 NB'],
        items: [
          { tag: 1, asked: 'Ball valve 50 NB', qty: -5, unit: 'Nos', sku: 'vfc-bv-050', confidence: 'high' },
          { asked: 'HDPE pipe 90 mm', qty: 'twelve', sku: 'XYZ-999', confidence: 'high' },
          { asked: 'Gasket set', qty: '12.6', confidence: 'certain' },
          { asked: '', qty: 5 }, null, 'string item',
          { asked: 'Butterfly valve 150 NB', qty: null, sku: 'VFC-BF-150', confidence: 'medium' },
        ],
      }),
      many: m.normalizeBoq({ items: Array.from({ length: 45 }, (_, i) => ({ asked: `Item ${i}`, qty: 1 })) }).items.length,
      competitor: m.normalizeBoq({ customer: 'Meridian Valve Works' }).matchAcc || null,
    }));
    expect(r.nul).toEqual({ customer: '', project: '', items: [], skipped: [], readability: 'partial', matchAcc: null, notes: [] });
    expect(r.wrong).toMatchObject({ items: [], skipped: [], readability: 'partial' });
    expect(r.wrong.matchAcc.id).toBe('acc_kaveri');
    expect(r.boq.items).toEqual([
      { tag: '1', asked: 'Ball valve 50 NB', qty: 0, unit: 'Nos', pid: 'prd_bv050', confidence: 'high', note: '' },
      { tag: '', asked: 'HDPE pipe 90 mm', qty: null, unit: '', pid: '', confidence: 'low', note: 'XYZ-999 isn’t in the catalogue' },
      { tag: '', asked: 'Gasket set', qty: 13, unit: '', pid: '', confidence: 'low', note: '' },
      { tag: '', asked: 'Butterfly valve 150 NB', qty: null, unit: '', pid: 'prd_bf150', confidence: 'medium', note: '' },
    ]);
    expect(r.boq).toMatchObject({ customer: 'Kaveri Agro Systems', project: '7', readability: 'good', skipped: ['Air release valve 25 NB'] });
    expect(r.boq.matchAcc.id).toBe('acc_kaveri');
    expect(r.many).toBe(40);
    // A competitor named on the BOQ is never matched as the customer.
    expect(r.competitor).toBeNull();
  });

  test('list fields drop null and object entries instead of showing "null" or "[object Object]" @negative', async ({ app }) => {
    const r = await app.logic(m => ({
      risks: m.normalizeNotes({ risks: [null, 'Price pressure from Meridian', {}, ''] }, 'opp_kaveri_drip').risks,
      skipped: m.normalizeBoq({ skipped: [null, 'Air release valve 25 NB', {}, ''] }).skipped,
    }));
    expect.soft(r.risks, 'normalizeNotes risks').toEqual(['Price pressure from Meridian']);
    expect.soft(r.skipped, 'normalizeBoq skipped').toEqual(['Air release valve 25 NB']);
  });
});

test.describe('formatting and form helpers', () => {
  test('esc neutralises HTML special characters in hostile text @negative', async ({ app }) => {
    const r = await app.logic(m => [
      m.esc(`<script>alert("x") & 'y'</script>`),
      m.esc('" onmouseover="steal()'),
      m.esc('&amp;'),
      m.esc(null), m.esc(undefined), m.esc(0), m.esc('Kaveri Agro Systems'),
    ]);
    expect(r).toEqual([
      '&lt;script&gt;alert(&quot;x&quot;) &amp; &#39;y&#39;&lt;/script&gt;',
      '&quot; onmouseover=&quot;steal()',
      '&amp;amp;',
      '', '', '0', 'Kaveri Agro Systems',
    ]);
  });

  test('L() shows rupees, lakh and crore, and switches to crore at 100 lakh @negative', async ({ app }) => {
    const r = await app.logic(m => ({
      plain: [0, 999, 99999, 100000, 1234567, 2500000, 10000000, 12345678.9, '2500000'].map(m.L),
      junk: [null, undefined, 'abc', NaN].map(m.L),
      edge: m.L(9999999),
    }));
    expect(r.plain).toEqual(['₹0', '₹999', '₹99,999', '₹1.0 L', '₹12.3 L', '₹25.0 L', '₹1.00 Cr', '₹1.23 Cr', '₹25.0 L']);
    expect(r.junk).toEqual(['₹0', '₹0', '₹0', '₹0']);
    // ₹99,99,999 rounds to 100 lakh, which is 1 crore.
    expect.soft(r.edge).toBe('₹1.00 Cr');
  });

  test('validate reports missing required values, non-numbers and values below the minimum @negative', async ({ app }) => {
    const r = await app.logic(m => {
      const F = [{ k: 'company', label: 'Company', req: true }, { k: 'qty', label: 'Quantity', type: 'number', req: true, min: 1 }, { k: 'inds', label: 'Industries', type: 'checks', req: true }];
      const ok = { company: 'Kaveri', qty: 1, inds: ['Pharma'] };
      const est = [{ k: 'est', label: 'Estimated value', type: 'number', min: 0 }];
      return [
        m.validate(F, { ...ok, company: '' }),
        m.validate(F, { ...ok, company: null }),
        m.validate(F, { ...ok, qty: null }),
        m.validate(F, { ...ok, qty: Number('ten') }),
        m.validate(F, { ...ok, qty: 0 }),
        m.validate(F, { ...ok, qty: -3 }),
        m.validate(F, { ...ok, inds: [] }),
        m.validate(F, { company: '', qty: Number('x'), inds: [] }),
        m.validate(F, ok),
        m.validate(est, { est: null }),
        m.validate(est, { est: 0 }),
      ];
    });
    expect(r).toEqual([
      'Company is required.',
      'Company is required.',
      'Quantity is required.',
      'Quantity must be a number.',
      'Quantity can’t be below 1.',
      'Quantity can’t be below 1.',
      'Industries is required.',
      'Company is required.',
      '',
      '',
      '',
    ]);
  });
});
