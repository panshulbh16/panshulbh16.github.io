// Unit tests for the PSI Planning Grid solver (psi-planner/solver.js).
// solver.js is a classic browser script, so it is evaluated in a node:vm context and read from module.exports.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const src = readFileSync(new URL("../psi-planner/solver.js", import.meta.url), "utf8");
const ctx = { module: { exports: {} }, Intl, Math, Date, Set, Array, Object, String, Number, isFinite, parseFloat, Infinity };
vm.createContext(ctx);
vm.runInContext(src, ctx, { filename: "solver.js" });
const S = ctx.module.exports;

// Objects built inside the vm context have that realm's prototypes; clone them so deepStrictEqual compares values.
const J = v => structuredClone(v);
const close = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) <= eps, `expected ${a} ≈ ${b}`);
const closeAll = (a, b, eps = 1e-6) => { assert.equal(a.length, b.length); a.forEach((v, i) => close(v, b[i], eps)); };

// Neutral parameters: no fences, no lead time, no excess flag. Each test overrides what it exercises.
const BASE = { dtf: 0, ptf: 0, rtf: 0, preLT: 0, procLT: 0, postLT: 0, excessDays: 0 };
function mk({ boh = 0, fc, so, firm, ss, cap, start, view = "weekly", uom = "EA", ...p }) {
  const n = fc.length, z = () => Array(n).fill(0);
  const D = { start: start ?? (view === "weekly" ? "2026-10-19" : "2026-10"), n, fc, so: so ?? z(), firm: firm ?? z(), ss: ss ?? z(), cap: cap ?? z() };
  const it = { code: "T-1", desc: "Test item", uom, boh, p: Object.assign(S.defaults(), BASE, p) };
  it[view === "weekly" ? "wk" : "mo"] = D;
  return it;
}
const run = (it, view = it.wk ? "weekly" : "monthly") => J(S.solve(it, view));
const msgs = (it, view = it.wk ? "weekly" : "monthly") => J(S.messages(it, S.solve(it, view)));

describe("helpers", () => {
  test("num parses grouped, padded and junk input", () => {
    assert.equal(S.num("1,234.5"), 1234.5);
    assert.equal(S.num(" 12 "), 12);
    assert.equal(S.num("1,20,000"), 120000);
    for (const v of ["abc", "", null, undefined, NaN, Infinity]) assert.equal(S.num(v), 0);
  });
  test("fmt uses Indian grouping and two decimals", () => {
    assert.equal(S.fmt(1234567.891), "12,34,567.89");
    assert.equal(S.fmt(-100), "-100");
  });
  test("never produces or prints negative zero", () => {
    assert.equal(S.fmt(-0), "0");
    assert.equal(S.fmt(-0.001), "0");
    const r = run(mk({ fc: [0, 0], so: [0, 0], ssMethod: "STAT" }));
    for (const k of ["dem", "ss", "plan", "eoh"]) r[k].forEach(v => assert.ok(Object.is(v, 0), `${k} is -0`));
  });
  test("esc escapes HTML", () => assert.equal(S.esc('<a href="x">&'), "&lt;a href=&quot;x&quot;&gt;&amp;"));
  test("clamp and period limits", () => {
    assert.equal(S.clamp(5, 0, 3), 3);
    assert.equal(S.clamp(-1, 0, 3), 0);
    assert.deepEqual(J(S.LIM), { weekly: [4, 52], monthly: [3, 24] });
  });
  test("worst status ranks out > low > excess > ok", () => {
    assert.equal(S.worst(["ok", "excess", "low", "out"]), "out");
    assert.equal(S.worst(["ok", "excess", "low"]), "low");
    assert.equal(S.worst(["ok", "excess"]), "excess");
    assert.equal(S.worst(["ok"]), "ok");
  });
});

describe("projection", () => {
  test("ending on hand = BOH + firm + planned − demand, without planning", () => {
    const r = run(mk({ boh: 100, fc: [30, 40, 50, 60], firm: [0, 20, 0, 0], autoPlan: false }));
    assert.deepEqual(r.dem, [30, 40, 50, 60]);
    assert.deepEqual(r.boh, [100, 70, 50, 0]);
    assert.deepEqual(r.plan, [0, 0, 0, 0]);
    assert.deepEqual(r.eoh, [70, 50, 0, -60]);
    assert.deepEqual(r.gap, [70, 50, 0, -60]);
    assert.deepEqual(r.reason, ["", "", "", "off"]);
    assert.deepEqual(r.st, ["ok", "ok", "ok", "out"]);
    assert.deepEqual(r.orders, []);
    assert.deepEqual(r.rel, [0, 0, 0, 0]);
    assert.equal(r.cap, null);
    assert.equal(r.util, null, "no utilisation without a capacity constraint");
  });

  test("include firm off ignores firm supply", () => {
    const on = run(mk({ boh: 100, fc: [30, 30], firm: [50, 0], autoPlan: false }));
    const off = run(mk({ boh: 100, fc: [30, 30], firm: [50, 0], autoPlan: false, includeFirm: false }));
    assert.deepEqual(on.eoh, [120, 90]);
    assert.deepEqual(off.eoh, [70, 40]);
    assert.deepEqual(off.firm, [0, 0]);
  });

  test("negative opening inventory projects negative and is planned back to safety stock", () => {
    const off = run(mk({ boh: -50, fc: [10, 10], autoPlan: false }));
    assert.deepEqual(off.eoh, [-60, -70]);
    closeAll(off.doc, [-42, -49]);
    assert.deepEqual(off.st, ["out", "out"]);
    const on = run(mk({ boh: -50, fc: [10, 10] }));
    assert.deepEqual(on.plan, [60, 10]);
    assert.deepEqual(on.eoh, [0, 0]);
  });
});

describe("lot sizing", () => {
  const base = { boh: 100, fc: [50, 50, 50, 50], ss: [20, 20, 20, 20] };
  test("lot-for-lot orders exactly the shortfall to safety stock", () => {
    const r = run(mk({ ...base, lotRule: "L4L" }));
    assert.deepEqual(r.plan, [0, 20, 50, 50]);
    assert.deepEqual(r.eoh, [50, 20, 20, 20]);
    assert.deepEqual(r.orders.map(o => [o.due, o.qty, o.count]), [[1, 20, 1], [2, 50, 1], [3, 50, 1]]);
  });
  test("fixed order quantity orders in multiples of the FOQ", () => {
    const r = run(mk({ ...base, lotRule: "FOQ", foq: 30 }));
    assert.deepEqual(r.plan, [0, 30, 60, 30]);
    assert.deepEqual(r.eoh, [50, 30, 40, 20]);
  });
  test("fixed days supply covers demand through the window end", () => {
    const r = run(mk({ ...base, lotRule: "FDS", fdsDays: 14 }));
    assert.deepEqual(r.plan, [0, 70, 0, 50]);
    assert.deepEqual(r.eoh, [50, 70, 20, 20]);
    const one = run(mk({ ...base, lotRule: "FDS", fdsDays: 7 }));
    assert.deepEqual(one.plan, [0, 20, 50, 50], "a one-bucket window behaves like lot-for-lot");
  });
  test("min–max triggers below min and orders up to max", () => {
    const r = run(mk({ ...base, lotRule: "MINMAX", minInv: 40, maxInv: 100 }));
    assert.deepEqual(r.plan, [0, 100, 0, 100]);
    assert.deepEqual(r.eoh, [50, 100, 50, 100]);
  });
  test("minimum order quantity raises small orders", () => {
    const r = run(mk({ ...base, moq: 45 }));
    assert.deepEqual(r.plan, [0, 45, 45, 45]);
    assert.deepEqual(r.eoh, [50, 45, 40, 35]);
  });
  test("fixed lot multiple rounds orders up", () => {
    const r = run(mk({ ...base, flm: 25 }));
    assert.deepEqual(r.plan, [0, 25, 50, 50]);
    assert.deepEqual(r.eoh, [50, 25, 25, 25]);
  });
  test("minimum order quantity applies before the lot multiple", () => {
    const r = run(mk({ ...base, moq: 30, flm: 25 }));
    assert.deepEqual(r.plan, [0, 50, 50, 50]);
  });
  test("rounding on rounds demand and orders up to whole units; off keeps fractions", () => {
    const on = run(mk({ fc: [10.5, 0.25] }));
    assert.deepEqual(on.dem, [11, 1]);
    assert.deepEqual(on.plan, [11, 1]);
    const off = run(mk({ fc: [10.5, 0.25], roundQty: false }));
    assert.deepEqual(off.dem, [10.5, 0.25]);
    assert.deepEqual(off.plan, [10.5, 0.25]);
    assert.deepEqual(off.eoh, [0, 0]);
    const ssOn = run(mk({ fc: [10], ss: [2.2] }));
    assert.deepEqual(ssOn.plan, [13]);
    const ssOff = run(mk({ fc: [10], ss: [2.2], roundQty: false }));
    close(ssOff.plan[0], 12.2);
    close(ssOff.eoh[0], 2.2);
  });
  test("maximum order quantity splits the order count, not the quantity", () => {
    const r = run(mk({ fc: [70], maxOq: 30 }));
    assert.equal(r.orders[0].qty, 70);
    assert.equal(r.orders[0].count, 3);
    assert.match(msgs(mk({ fc: [70], maxOq: 30 }))[0].t, /70 EA as 3 orders: release W43, due W43/);
    assert.equal(run(mk({ fc: [70], maxOq: 70 })).orders[0].count, 1);
    assert.equal(run(mk({ fc: [70], maxOq: 0 })).orders[0].count, 1);
  });
});

describe("time fences and demand", () => {
  test("planning time fence suppresses planned orders with reason ptf", () => {
    const it = mk({ fc: [10, 10, 10, 10], ptf: 14 });
    const r = run(it);
    assert.equal(r.ptfB, 2);
    assert.deepEqual(r.plan, [0, 0, 30, 10]);
    assert.deepEqual(r.eoh, [-10, -20, 0, 0]);
    assert.deepEqual(r.reason, ["ptf", "ptf", "", ""]);
    assert.deepEqual(r.st, ["out", "out", "ok", "ok"]);
    assert.match(msgs(it)[0].t, /Inside the planning time fence, so no planned order was created/);
    assert.equal(run(mk({ fc: [10, 10, 10, 10], ptf: 7 })).ptfB, 1);
    assert.equal(run(mk({ fc: [10, 10, 10, 10], ptf: 8 })).ptfB, 2);
  });

  test("demand time fence uses sales orders only, then the consumption rule", () => {
    const d = { fc: [100, 100, 100, 100], so: [30, 200, 50, 150], dtf: 14, autoPlan: false };
    assert.equal(run(mk(d)).dtfB, 2);
    assert.deepEqual(run(mk({ ...d, consume: "GREATER" })).dem, [30, 200, 100, 150]);
    assert.deepEqual(run(mk({ ...d, consume: "FC" })).dem, [30, 200, 100, 100]);
    assert.deepEqual(run(mk({ ...d, consume: "SO" })).dem, [30, 200, 50, 150]);
    assert.deepEqual(run(mk({ ...d, consume: "SUM" })).dem, [30, 200, 150, 250]);
  });

  test("each consumption rule outside the fence", () => {
    const d = { fc: [100, 100], so: [30, 150], autoPlan: false };
    assert.deepEqual(run(mk({ ...d, consume: "GREATER" })).dem, [100, 150]);
    assert.deepEqual(run(mk({ ...d, consume: "FC" })).dem, [100, 100]);
    assert.deepEqual(run(mk({ ...d, consume: "SO" })).dem, [30, 150]);
    assert.deepEqual(run(mk({ ...d, consume: "SUM" })).dem, [130, 250]);
  });

  test("shrinkage grosses demand up by 1 ÷ (1 − rate), capped at 90%", () => {
    assert.deepEqual(run(mk({ fc: [100, 30], shrink: 20, autoPlan: false })).dem, [125, 38]);
    assert.deepEqual(run(mk({ fc: [100, 30], shrink: 20, autoPlan: false, roundQty: false })).dem, [125, 37.5]);
    assert.deepEqual(run(mk({ fc: [100], shrink: 95, autoPlan: false })).dem, [1000]);
    assert.deepEqual(run(mk({ fc: [0], so: [80], dtf: 7, shrink: 20, autoPlan: false })).dem, [100], "applies to orders inside the fence too");
  });
});

describe("release and yield", () => {
  test("yield grosses up the release (start) quantity, not the receipt", () => {
    const it = mk({ fc: [0, 40], yield: 80 });
    const r = run(it);
    assert.deepEqual(r.plan, [0, 40]);
    assert.deepEqual(r.rel, [0, 50]);
    assert.equal(r.yld, 0.8);
    assert.deepEqual([r.orders[0].qty, r.orders[0].start], [40, 50]);
    assert.match(msgs(it)[0].t, /start qty 50 at 80% yield/);
    assert.equal(run(mk({ fc: [0, 40], yield: 75 })).rel[1], 54);
    close(run(mk({ fc: [0, 40], yield: 75, roundQty: false })).rel[1], 160 / 3);
  });

  test("release is offset by total lead time into the bucket containing the release day", () => {
    const fc = [0, 0, 40, 0];
    const r7 = run(mk({ fc, procLT: 7 }));
    assert.equal(r7.LT, 7);
    assert.deepEqual(r7.rel, [0, 40, 0, 0]);
    assert.deepEqual([r7.orders[0].due, r7.orders[0].rel, r7.orders[0].late], [2, 1, 0]);
    const r14 = run(mk({ fc, preLT: 2, procLT: 10, postLT: 2 }));
    assert.equal(r14.LT, 14);
    assert.deepEqual(r14.rel, [40, 0, 0, 0]);
    assert.deepEqual(run(mk({ fc, procLT: 10 })).rel, [40, 0, 0, 0], "day 4 falls in the first bucket");
    assert.equal(run(mk({ fc, preLT: -5, procLT: 7 })).LT, 7, "negative lead times count as zero");
  });

  test("a release before the horizon start is past due", () => {
    const it = mk({ fc: [0, 40, 0, 0], procLT: 14 });
    const r = run(it);
    assert.deepEqual([r.orders[0].rel, r.orders[0].late], [0, 7]);
    assert.deepEqual(r.rel, [40, 0, 0, 0]);
    const m = msgs(it);
    assert.equal(m[0].c, "out");
    assert.match(m[0].t, /Past due release\.<\/b> Planned order 40 EA due W44 should have been released 7 days before the horizon start \(lead time 14 days\)/);
  });

  test("release inside the release time fence says release now", () => {
    const now = msgs(mk({ fc: [0, 40, 0, 0], procLT: 7, rtf: 7 }));
    assert.equal(now[0].c, "rel");
    assert.match(now[0].t, /Release now\.<\/b> Planned order 40 EA, due W44/);
    const later = msgs(mk({ fc: [0, 40, 0, 0], procLT: 7, rtf: 0 }));
    assert.equal(later[0].c, "plan");
    assert.match(later[0].t, /release W43, due W44/);
  });

  test("monthly lead time offsets use calendar days", () => {
    assert.deepEqual(run(mk({ view: "monthly", start: "2026-01", fc: [0, 40, 0], procLT: 31 })).orders[0].late, 0);
    const late = run(mk({ view: "monthly", start: "2026-01", fc: [0, 40, 0], procLT: 32 }));
    assert.deepEqual([late.orders[0].rel, late.orders[0].late], [0, 1]);
  });
});

describe("buckets", () => {
  const D = (start, n) => ({ start, n });
  test("weekly buckets are 7 days with ISO week labels", () => {
    const b = J(S.buckets("weekly", D("2026-10-19", 3)));
    assert.deepEqual(b.map(x => x.lab), ["W43", "W44", "W45"]);
    assert.deepEqual(b.map(x => x.sub), ["19 Oct", "26 Oct", "02 Nov"]);
    assert.deepEqual(b.map(x => x.days), [7, 7, 7]);
    assert.deepEqual(b.map(x => x.startDay), [0, 7, 14]);
  });
  test("2026 has a W53 and rolls over to W01 of 2027", () => {
    const b = J(S.buckets("weekly", D("2026-12-21", 3)));
    assert.deepEqual(b.map(x => x.lab), ["W52", "W53", "W01"]);
    assert.deepEqual(b.map(x => x.yr), [2026, 2026, 2027]);
    assert.deepEqual(b.map(x => x.sub), ["21 Dec", "28 Dec", "04 Jan"]);
    assert.deepEqual(J(S.isoWeek(new Date(Date.UTC(2027, 0, 3)))), { w: 53, y: 2026 });
    assert.deepEqual(J(S.isoWeek(new Date(Date.UTC(2024, 11, 30)))), { w: 1, y: 2025 });
  });
  test("monthly buckets use real month lengths", () => {
    const b = J(S.buckets("monthly", D("2026-01", 3)));
    assert.deepEqual(b.map(x => x.lab), ["Jan", "Feb", "Mar"]);
    assert.deepEqual(b.map(x => x.days), [31, 28, 31]);
    assert.deepEqual(b.map(x => x.startDay), [0, 31, 59]);
    assert.deepEqual(b.map(x => x.sub), ["2026", "2026", "2026"]);
    assert.equal(J(S.buckets("monthly", D("2028-02", 1)))[0].days, 29);
    const y = J(S.buckets("monthly", D("2026-11", 3)));
    assert.deepEqual(y.map(x => [x.lab, x.yr]), [["Nov", 2026], ["Dec", 2026], ["Jan", 2027]]);
  });
  test("day-based fences convert to each bucket size", () => {
    const m = d => run(mk({ view: "monthly", start: "2026-01", fc: [1, 1, 1], dtf: d, autoPlan: false })).dtfB;
    assert.deepEqual([m(14), m(31), m(32)], [1, 1, 2]);
    assert.equal(run(mk({ fc: [1, 1, 1, 1], dtf: 14, autoPlan: false })).dtfB, 2);
  });
});

describe("safety stock", () => {
  test("days of cover uses current + next 3 periods of demand", () => {
    const r = run(mk({ fc: [70, 70, 70, 70, 140], ssMethod: "DOC", ssDays: 14, autoPlan: false }));
    assert.deepEqual(r.ss, [140, 175, 187, 210, 280]);
    close(run(mk({ fc: [70, 70, 70, 70, 140], ssMethod: "DOC", ssDays: 14, autoPlan: false, roundQty: false })).ss[2], 560 / 3);
    const mo = run(mk({ view: "monthly", start: "2026-01", fc: [310, 280, 310], ssMethod: "DOC", ssDays: 10, autoPlan: false }));
    assert.deepEqual(mo.ss, [100, 100, 100]);
  });
  test("z for 95% service is about 1.645", () => {
    close(S.invNorm(0.95), 1.644854, 1e-5);
    close(S.invNorm(0.975), 1.959964, 1e-5);
    close(S.invNorm(0.5), 0, 1e-9);
    close(S.invNorm(0.01), -2.326348, 1e-5);
  });
  test("statistical safety stock = z × σ × √(max(LT, period) ÷ period)", () => {
    const it = mk({ fc: [10, 20, 30, 40], ssMethod: "STAT", svc: 95, procLT: 7, autoPlan: false });
    const r = run(it);
    close(r.z, 1.644854, 1e-5);
    close(r.sigma, Math.sqrt(500 / 3));
    assert.deepEqual(r.ss, [22, 22, 22, 22]);
    assert.deepEqual(run(mk({ ...it.wk, fc: [10, 20, 30, 40], ssMethod: "STAT", svc: 95, procLT: 28, autoPlan: false })).ss, [43, 43, 43, 43]);
    assert.deepEqual(run(mk({ view: "monthly", fc: [10, 20, 30, 40], ssMethod: "STAT", svc: 95, procLT: 7, autoPlan: false })).ss, [22, 22, 22, 22]);
    assert.deepEqual(run(mk({ fc: [10], ssMethod: "STAT", autoPlan: false })).ss, [0], "one period has no spread");
    assert.ok(run(mk({ fc: [10, 20], ssMethod: "STAT", svc: 100, autoPlan: false })).z > 3.7, "service level clamps below 100%");
  });
});

describe("capacity", () => {
  const c = { fc: [0, 0, 100, 0], cap: [60, 60, 60, 60], constrained: true };
  const within = r => r.plan.forEach((p, i) => assert.ok(p + r.firm[i] <= r.cap[i] + 1e-9, `period ${i} over capacity`));
  test("capacity caps planned supply with reason cap", () => {
    const it = mk({ ...c, buildAhead: false });
    const r = run(it);
    assert.deepEqual(r.plan, [0, 0, 60, 40]);
    assert.deepEqual(r.eoh, [0, 0, -40, 0]);
    assert.equal(r.reason[2], "cap");
    closeAll(r.util, [0, 0, 1, 40 / 60]);
    within(r);
    assert.ok(msgs(it).some(m => m.c === "out" && /Capacity limits supply to 60 EA/.test(m.t)));
  });
  test("build ahead pulls the shortfall into the latest earlier period with spare capacity", () => {
    const it = mk({ ...c, buildAhead: true });
    const r = run(it);
    assert.deepEqual(r.plan, [0, 40, 60, 0]);
    assert.deepEqual(r.eoh, [0, 40, 0, 0]);
    assert.deepEqual(r.reason, ["", "", "", ""]);
    assert.deepEqual(r.orders.map(o => [o.due, o.qty, o.built]), [[1, 40, 40], [2, 60, 0]]);
    within(r);
    assert.ok(msgs(it).some(m => m.c === "cap" && /Build ahead\.<\/b> 40 EA pulled into W44/.test(m.t)));
  });
  test("build ahead spreads across several earlier periods", () => {
    const r = run(mk({ ...c, fc: [0, 0, 150, 0], buildAhead: true }));
    assert.deepEqual(r.plan, [30, 60, 60, 0]);
    assert.deepEqual(r.eoh, [30, 90, 0, 0]);
    within(r);
  });
  test("build ahead never goes inside the planning time fence", () => {
    const r = run(mk({ ...c, fc: [0, 0, 150, 0], buildAhead: true, ptf: 7 }));
    assert.deepEqual(r.plan, [0, 60, 60, 30]);
    assert.deepEqual(r.eoh, [0, 60, -30, 0]);
    assert.equal(r.reason[2], "cap");
    within(r);
  });
  test("build ahead respects the fixed lot multiple", () => {
    const r = run(mk({ ...c, flm: 25, buildAhead: true }));
    assert.deepEqual(r.plan, [0, 50, 50, 0]);
    r.plan.forEach(p => assert.equal(p % 25, 0));
    within(r);
  });
  test("firm supply above capacity raises an overload message; zero capacity utilisation", () => {
    const it = mk({ fc: [0, 0], firm: [100, 0], cap: [60, 60], constrained: true, autoPlan: false });
    assert.ok(msgs(it).some(m => /Capacity overload\.<\/b> Firm supply 100 EA exceeds capacity 60/.test(m.t)));
    const z = run(mk({ fc: [0, 0], firm: [10, 0], cap: [0, 0], constrained: true, autoPlan: false }));
    assert.deepEqual(z.util, [Infinity, 0]);
  });
});

describe("status and days of cover", () => {
  test("statuses out / low / excess / ok", () => {
    const r = run(mk({ boh: 300, fc: [0, 100, 100, 100, 100], ss: [50, 50, 50, 50, 50], excessDays: 20, autoPlan: false }));
    assert.deepEqual(r.eoh, [300, 200, 100, 0, -100]);
    closeAll(r.doc, [21, 14, 7, 0, -7]);
    assert.deepEqual(r.st, ["excess", "ok", "ok", "low", "out"]);
    assert.equal(S.worst(r.st), "out");
  });
  test("zero demand gives infinite days of cover", () => {
    const it = mk({ boh: 100, fc: [0, 0, 0, 0], excessDays: 60 });
    const r = run(it);
    assert.deepEqual(r.doc, [Infinity, Infinity, Infinity, Infinity]);
    assert.deepEqual(r.st, ["excess", "excess", "excess", "excess"]);
    const m = msgs(it);
    assert.equal(m.length, 1);
    assert.match(m[0].t, /Excess<\/b> W43–W46: up to unlimited days of cover against the 60-day limit/);
    assert.deepEqual(run(mk({ boh: 100, fc: [0, 0, 0, 0] })).st, ["ok", "ok", "ok", "ok"]);
  });
  test("an all-zero item is quiet", () => {
    const it = mk({ fc: [0, 0, 0, 0], excessDays: 60 });
    const r = run(it);
    assert.deepEqual(r.eoh, [0, 0, 0, 0]);
    assert.deepEqual(r.doc, [0, 0, 0, 0]);
    assert.deepEqual(r.st, ["ok", "ok", "ok", "ok"]);
    assert.deepEqual(r.orders, []);
    assert.deepEqual(msgs(it), []);
  });
});

describe("action messages", () => {
  test("stockout, below safety stock and excess", () => {
    const m = msgs(mk({ boh: 300, fc: [0, 100, 100, 100, 100], ss: [50, 50, 50, 50, 50], excessDays: 20, autoPlan: false }));
    assert.deepEqual(m.map(x => [x.i, x.c]), [[0, "excess"], [3, "low"], [4, "out"]]);
    assert.match(m[0].t, /Excess<\/b> W43: up to 21 days of cover against the 20-day limit/);
    assert.match(m[1].t, /Below safety stock<\/b> by 50 EA \(ending 0 vs 50\)\. Planned orders are switched off\./);
    assert.match(m[2].t, /Stockout\.<\/b> Ending on hand -100 EA; 150 EA needed to restore safety stock/);
  });
  test("reschedule in pulls later firm supply into the shortage", () => {
    const m = msgs(mk({ fc: [10, 0, 0, 0], firm: [0, 0, 50, 0], ptf: 14 }));
    assert.deepEqual(m.map(x => [x.i, x.c]), [[0, "out"], [0, "resch"], [1, "out"]]);
    assert.match(m[1].t, /Reschedule in<\/b> firm supply 50 EA from W45 to W43\./);
  });
  test("reschedule out to replace a later planned order", () => {
    const m = msgs(mk({ boh: 100, fc: [10, 10, 10, 200], firm: [50, 0, 0, 0] }));
    const r = m.find(x => x.c === "resch");
    assert.match(r.t, /Reschedule out<\/b> firm supply 50 EA from W43 to W46, where it can replace the planned order\./);
  });
  test("reschedule out to the first period that needs it", () => {
    const m = msgs(mk({ boh: 100, fc: [10, 10, 10, 200], firm: [50, 0, 0, 0], autoPlan: false }));
    const r = m.find(x => x.c === "resch");
    assert.match(r.t, /Reschedule out<\/b> firm supply 50 EA from W43 to W46\.$/);
  });
  test("cancel or defer firm supply that is never needed", () => {
    const m = msgs(mk({ boh: 100, fc: [10, 10, 10, 10], firm: [50, 0, 0, 0], autoPlan: false }));
    assert.equal(m.length, 1);
    assert.match(m[0].t, /Cancel or defer<\/b> firm supply 50 EA in W43/);
  });
  test("firm supply needed in its own period gets no message", () => {
    assert.deepEqual(msgs(mk({ fc: [50, 0], firm: [50, 0] })), []);
  });
  test("the unit of measure is escaped", () => {
    const m = msgs(mk({ fc: [10], autoPlan: false, uom: "<b>" }));
    assert.match(m[0].t, /&lt;b&gt;/);
    assert.doesNotMatch(m[0].t, /10 <b>/);
  });
});

describe("sample data", () => {
  test("three items that solve cleanly in both views", () => {
    const s = J(S.sample());
    assert.deepEqual(s.items.map(i => i.code), ["FG-1001", "FG-2040", "RM-0310"]);
    for (const it of s.items) for (const v of ["weekly", "monthly"]) {
      const r = run(it, v);
      assert.equal(r.n, 12);
      for (const k of ["eoh", "plan", "rel", "dem", "ss"]) assert.ok(r[k].every(Number.isFinite), `${it.code} ${v} ${k}`);
      if (r.cap) r.plan.forEach((p, i) => assert.ok(p + r.firm[i] <= r.cap[i] + 1e-9 || r.firm[i] > r.cap[i], `${it.code} ${v} capacity ${i}`));
      assert.doesNotThrow(() => S.messages(it, S.solve(it, v)));
    }
  });
});
