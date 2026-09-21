import { pickActiveSection } from "./scroll-spy.js";

const root = document.documentElement;
const toggle = document.getElementById("theme-toggle");
const stored = localStorage.getItem("theme");
if (stored === "light" || stored === "dark") root.dataset.theme = stored;

const resolved = () =>
  root.dataset.theme || (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");

const label = () => {
  if (!toggle) return;
  const light = resolved() === "light";
  toggle.textContent = light ? "Use dark theme" : "Use light theme";
  toggle.setAttribute("aria-pressed", light ? "true" : "false");
};
label();
toggle?.addEventListener("click", () => {
  const next = resolved() === "light" ? "dark" : "light";
  root.dataset.theme = next;
  localStorage.setItem("theme", next);
  label();
});

const links = [...document.querySelectorAll(".section-nav a[href^='#']")];
const sections = links
  .map((a) => document.querySelector(a.getAttribute("href")))
  .filter(Boolean);

const setCurrent = (id) => {
  if (!id) return;
  links.forEach((a) => {
    const on = a.getAttribute("href") === `#${id}`;
    if (on) a.setAttribute("aria-current", "true");
    else a.removeAttribute("aria-current");
  });
};

const metrics = () => {
  const scrollY = window.scrollY;
  return {
    scrollY,
    viewportHeight: window.innerHeight,
    documentHeight: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight),
    sections: sections.map((el) => ({
      id: el.id,
      top: Math.round(el.getBoundingClientRect().top + scrollY),
    })),
  };
};

let ticking = false;
let lockId = null;
let lockTimer = 0;

const syncNav = () => {
  ticking = false;
  if (lockId) {
    setCurrent(lockId);
    return;
  }
  const { sections: tops, ...rest } = metrics();
  setCurrent(pickActiveSection(tops, rest));
};

const onScroll = () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(syncNav);
};

window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", onScroll);
window.addEventListener("hashchange", () => {
  lockId = null;
  syncNav();
});
window.addEventListener("load", syncNav);
window.addEventListener("scrollend", () => {
  lockId = null;
  syncNav();
});
syncNav();

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
links.forEach((a) => {
  a.addEventListener("click", (event) => {
    const id = a.getAttribute("href")?.slice(1);
    const target = id ? document.getElementById(id) : null;
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
    }, reduceMotion ? 50 : 700);
  });
});

document.querySelectorAll("[data-tabs]").forEach((rootEl) => {
  const buttons = [...rootEl.querySelectorAll("[role='tab']")];
  const panels = [...rootEl.querySelectorAll("[role='tabpanel']")];
  const activate = (id) => {
    buttons.forEach((b) => {
      const on = b.id === id;
      b.setAttribute("aria-selected", on ? "true" : "false");
      b.tabIndex = on ? 0 : -1;
    });
    panels.forEach((p) => {
      p.hidden = p.getAttribute("aria-labelledby") !== id;
    });
  };
  buttons.forEach((b, i) => {
    b.addEventListener("click", () => activate(b.id));
    b.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      e.preventDefault();
      const next = e.key === "ArrowRight" ? (i + 1) % buttons.length : (i - 1 + buttons.length) % buttons.length;
      buttons[next].focus();
      activate(buttons[next].id);
    });
  });
});
