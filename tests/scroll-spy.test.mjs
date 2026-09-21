import { test } from "node:test";
import assert from "node:assert/strict";
import { pickActiveSection } from "../assets/scroll-spy.js";

const sections = [
  { id: "about", top: 72 },
  { id: "experience", top: 471 },
  { id: "projects", top: 1164 },
  { id: "contact", top: 3721 },
];
const vh = 761;

test("top of page is About", () => {
  assert.equal(pickActiveSection(sections, { scrollY: 0, viewportHeight: vh }), "about");
});

test("Experience heading in the upper third highlights Experience", () => {
  assert.equal(pickActiveSection(sections, { scrollY: 404, viewportHeight: vh }), "experience");
});

test("scrollIntoView on Projects does not snap back to Experience", () => {
  assert.equal(pickActiveSection(sections, { scrollY: 1032, viewportHeight: vh }), "projects");
});

test("tall Projects section stays active in the middle", () => {
  assert.equal(pickActiveSection(sections, { scrollY: 1835, viewportHeight: vh }), "projects");
});

test("Contact highlights once its heading has entered the viewport", () => {
  assert.equal(pickActiveSection(sections, { scrollY: 2963, viewportHeight: vh }), "contact");
});
