import { pickActiveSection } from "./scroll-spy.js";
import { mountSchematic, SCHEMATICS } from "./schematics.js";

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

/* ---------- Case-study tabs ---------- */

document.querySelectorAll("[data-tabs]").forEach(group => {
  const buttons = [...group.querySelectorAll("[role='tab']")];
  const panels = [...group.querySelectorAll("[role='tabpanel']")];
  const activate = id => {
    buttons.forEach(b => {
      const on = b.id === id;
      b.setAttribute("aria-selected", on ? "true" : "false");
      b.tabIndex = on ? 0 : -1;
    });
    panels.forEach(p => {
      p.hidden = p.getAttribute("aria-labelledby") !== id;
    });
  };
  buttons.forEach((b, i) => {
    b.addEventListener("click", () => activate(b.id));
    b.addEventListener("keydown", e => {
      const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      const edge = { Home: 0, End: buttons.length - 1 }[e.key];
      if (step === undefined && edge === undefined) return;
      e.preventDefault();
      const next = edge ?? (i + step + buttons.length) % buttons.length;
      buttons[next].focus();
      activate(buttons[next].id);
    });
  });
});

/* ---------- Case studies ---------- */

// A diagram is drawn the first time its "How it's built" is opened, when it has a size to lay out against.
document.querySelectorAll("details.built").forEach(details => {
  details.addEventListener("toggle", () => {
    const figure = details.querySelector("[data-schematic]");
    if (!details.open || !figure || figure.dataset.mounted) return;
    const spec = SCHEMATICS[figure.dataset.schematic];
    if (!spec) return;
    figure.dataset.mounted = "";
    mountSchematic(figure, spec, { animate: !reduceMotion });
  });
});

let opener = null;
document.querySelectorAll("[data-study]").forEach(button => {
  const dialog = document.getElementById(button.dataset.study);
  if (!dialog) return;
  button.addEventListener("click", () => {
    opener = button;
    dialog.showModal();
    dialog.scrollTop = 0;
    dialog.querySelector("[data-close]")?.focus();
  });
});
document.querySelectorAll("dialog.study").forEach(dialog => {
  dialog.querySelector("[data-close]")?.addEventListener("click", () => dialog.close());
  // A click on the dimmed page beside the panel closes it.
  dialog.addEventListener("click", e => {
    if (e.target === dialog) {
      const r = dialog.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (!inside) dialog.close();
    }
  });
  dialog.addEventListener("close", () => {
    opener?.focus({ preventScroll: true });
    opener = null;
  });
});
