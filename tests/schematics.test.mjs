import { test } from "node:test";
import assert from "node:assert/strict";
import { arrowhead, routeWire, SCHEMATICS } from "../assets/schematics.js";

const box = (left, top, w = 100, h = 40) => ({ left, top, right: left + w, bottom: top + h });

test("a part beside a tall hub is wired straight across at its own middle", () => {
  const part = box(0, 60);
  const hub = box(150, 0, 100, 300);
  const r = routeWire(part, hub);
  assert.equal(r.d, "M100 80H150");
  assert.equal(r.endDir, "right");
});

test("the hub wires straight out to each part on its right", () => {
  const hub = box(150, 0, 100, 300);
  const part = box(300, 200);
  assert.equal(routeWire(hub, part).d, "M250 220H300");
});

test("parts that don't overlap vertically get a stepped wire, turning halfway", () => {
  const r = routeWire(box(0, 0), box(200, 200));
  assert.equal(r.d, "M100 20H150V220H200");
  assert.deepEqual(r.end, { x: 200, y: 220 });
});

test("a wire leftwards leaves from the left side and points left", () => {
  const r = routeWire(box(300, 0), box(0, 0));
  assert.equal(r.d, "M300 20H100");
  assert.equal(r.endDir, "left");
  assert.equal(r.startDir, "right");
});

test("parts in one column are wired vertically", () => {
  const r = routeWire(box(0, 0), box(0, 100));
  assert.equal(r.d, "M50 40V100");
  assert.equal(r.endDir, "down");
});

test("arrowheads have their tip on the wire's end", () => {
  assert.equal(arrowhead({ x: 10, y: 10 }, "right"), "M10 10L4 7L4 13Z");
  assert.equal(arrowhead({ x: 10, y: 10 }, "up"), "M10 10L7 16L13 16Z");
});

test("every schematic wires parts that exist, notes every part, and fits its grid", () => {
  for (const [name, spec] of Object.entries(SCHEMATICS)) {
    const ids = new Set(spec.parts.map(p => p[0]));
    assert.equal(ids.size, spec.parts.length, `${name}: duplicate part ids`);
    for (const [from, to] of spec.wires) {
      assert.ok(ids.has(from) && ids.has(to), `${name}: wire ${from} → ${to} names a missing part`);
    }
    for (const id of ids) assert.ok(spec.notes[id], `${name}: no note for ${id}`);
    for (const [id, , , col, row] of spec.parts) {
      assert.ok(col >= 1 && col <= spec.cols && row >= 1, `${name}: ${id} is off the grid`);
    }
    assert.ok(spec.intro.length > 20, `${name}: no intro`);
  }
});
