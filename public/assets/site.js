import { pickActiveSection } from "./scroll-spy.js";

const root = document.documentElement;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Theme ---------- */

const resolved = () =>
  root.dataset.theme || (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");

const toggles = [...document.querySelectorAll("[data-theme-toggle]")];
const labelToggles = () => {
  const next = resolved() === "light" ? "dark" : "light";
  for (const t of toggles) t.setAttribute("aria-label", `Switch to ${next} theme`);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", resolved() === "light" ? "#f5f6f8" : "#0e1014");
};
toggles.forEach(t =>
  t.addEventListener("click", () => {
    const next = resolved() === "light" ? "dark" : "light";
    root.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Storage blocked: the switch still applies for this visit.
    }
    labelToggles();
  }),
);
labelToggles();

/* ---------- Section nav ---------- */

const links = [...document.querySelectorAll(".section-nav a[href^='#']")];
const sections = links.map(a => document.querySelector(a.getAttribute("href"))).filter(Boolean);

const setCurrent = id => {
  links.forEach(a => {
    if (id && a.getAttribute("href") === `#${id}`) a.setAttribute("aria-current", "true");
    else a.removeAttribute("aria-current");
  });
};

let ticking = false;
let lockId = null;
let lockTimer = 0;

const syncNav = () => {
  ticking = false;
  if (lockId) return setCurrent(lockId);
  const scrollY = window.scrollY;
  const tops = sections.map(el => ({ id: el.id, top: Math.round(el.getBoundingClientRect().top + scrollY) }));
  // Above the first section (the intro), nothing is highlighted.
  if (tops.length && scrollY + window.innerHeight * 0.32 < tops[0].top) return setCurrent(null);
  setCurrent(pickActiveSection(tops, { scrollY, viewportHeight: window.innerHeight }));
};
const onScroll = () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(syncNav);
};
window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", onScroll);
window.addEventListener("load", syncNav);
window.addEventListener("scrollend", () => {
  lockId = null;
  syncNav();
});
syncNav();

links.forEach(a => {
  a.addEventListener("click", event => {
    const id = a.getAttribute("href").slice(1);
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    lockId = id;
    setCurrent(id);
    history.replaceState(null, "", `#${id}`);
    target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    window.clearTimeout(lockTimer);
    lockTimer = window.setTimeout(() => {
      lockId = null;
      syncNav();
    }, reduceMotion ? 50 : 800);
  });
});
