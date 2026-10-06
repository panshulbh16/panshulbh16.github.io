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
  for (const t of toggles) {
    t.textContent = next === "light" ? "Light" : "Dark";
    t.setAttribute("aria-label", `Switch to ${next} theme`);
  }
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", resolved() === "light" ? "#f2f5f8" : "#0a1626");
};
const switchTheme = () => {
  const next = resolved() === "light" ? "dark" : "light";
  root.dataset.theme = next;
  try {
    localStorage.setItem("theme", next);
  } catch {
    // Storage blocked: the switch still applies for this visit.
  }
  labelToggles();
};
labelToggles();
toggles.forEach(t => t.addEventListener("click", switchTheme));

/* ---------- Section nav ---------- */

const links = [...document.querySelectorAll(".section-nav a[href^='#']")];
const sections = links.map(a => document.querySelector(a.getAttribute("href"))).filter(Boolean);

const setCurrent = id => {
  if (!id) return;
  links.forEach(a => {
    if (a.getAttribute("href") === `#${id}`) a.setAttribute("aria-current", "true");
    else a.removeAttribute("aria-current");
  });
};

const metrics = () => {
  const scrollY = window.scrollY;
  return {
    scrollY,
    viewportHeight: window.innerHeight,
    sections: sections.map(el => ({ id: el.id, top: Math.round(el.getBoundingClientRect().top + scrollY) })),
  };
};

let ticking = false;
let lockId = null;
let lockTimer = 0;

const syncNav = () => {
  ticking = false;
  if (lockId) return setCurrent(lockId);
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

/** Scrolls to an element by id, keeping the nav on the section it belongs to while the scroll runs. */
function goTo(id) {
  const target = document.getElementById(id);
  if (!target) return;
  const section = sections.find(s => s === target || s.contains(target));
  lockId = section?.id ?? null;
  setCurrent(lockId);
  history.replaceState(null, "", `#${id}`);
  target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  window.clearTimeout(lockTimer);
  lockTimer = window.setTimeout(() => {
    lockId = null;
    syncNav();
  }, reduceMotion ? 50 : 800);
}

links.forEach(a => {
  a.addEventListener("click", event => {
    event.preventDefault();
    goTo(a.getAttribute("href").slice(1));
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

/* ---------- Schematics ---------- */

document.querySelectorAll("[data-schematic]").forEach(figure => {
  const spec = SCHEMATICS[figure.dataset.schematic];
  if (spec) mountSchematic(figure, spec, { animate: !reduceMotion });
});

/* ---------- Jump-to palette ---------- */

const palette = document.getElementById("palette");
const input = document.getElementById("palette-input");
const list = document.getElementById("palette-list");
const empty = document.getElementById("palette-empty");
const opener = document.getElementById("palette-open");
const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
document.querySelectorAll("kbd[data-mod]").forEach(k => (k.textContent = isMac ? "⌘K" : "Ctrl K"));
if (isMac) opener?.setAttribute("aria-keyshortcuts", "Meta+K");

const external = url => () => window.open(url, "_blank", "noopener");
const ITEMS = [
  ...sections.map(s => ({ label: s.querySelector("h2")?.textContent ?? s.id, kind: "Section", run: () => goTo(s.id) })),
  ...[...document.querySelectorAll(".sheet")].map(s => ({ label: s.querySelector("h3").textContent, kind: "Project", run: () => goTo(s.id) })),
  { label: "Open Duely", kind: "heyduely.com", run: external("https://heyduely.com/") },
  { label: "Open Roamly", kind: "heyroamly.com", run: external("https://heyroamly.com/") },
  { label: "Open Opportunity Hunter", kind: "opportunityhunter.xyz", run: external("https://opportunityhunter.xyz") },
  { label: "Open Tailor", kind: "railway.app", run: external("https://tailor-production-6d17.up.railway.app") },
  { label: "GitHub", kind: "Link", run: external("https://github.com/panshulbh16") },
  { label: "LinkedIn", kind: "Link", run: external("https://www.linkedin.com/in/panshul-bharadwaj") },
  { label: "Email Panshul", kind: "Link", run: () => (window.location.href = "mailto:bharadwajpanshul@gmail.com") },
  { label: "Switch theme", kind: "Theme", run: switchTheme },
];

let shown = [];
let active = 0;
const render = () => {
  const q = input.value.trim().toLowerCase();
  shown = ITEMS.filter(item => !q || `${item.label} ${item.kind}`.toLowerCase().includes(q));
  active = Math.min(active, Math.max(shown.length - 1, 0));
  list.replaceChildren(...shown.map((item, i) => {
    const li = document.createElement("li");
    li.id = `palette-option-${i}`;
    li.setAttribute("role", "option");
    li.setAttribute("aria-selected", String(i === active));
    const kind = document.createElement("span");
    kind.textContent = item.kind;
    li.append(document.createTextNode(item.label), kind);
    li.addEventListener("pointermove", () => {
      if (active !== i) {
        active = i;
        highlight();
      }
    });
    li.addEventListener("click", () => choose(i));
    return li;
  }));
  empty.hidden = shown.length > 0;
  highlight();
};
const highlight = () => {
  [...list.children].forEach((li, i) => li.setAttribute("aria-selected", String(i === active)));
  const current = list.children[active];
  if (current) {
    input.setAttribute("aria-activedescendant", current.id);
    current.scrollIntoView({ block: "nearest" });
  } else {
    input.removeAttribute("aria-activedescendant");
  }
};
const choose = i => {
  const item = shown[i];
  if (!item) return;
  palette.close();
  item.run();
};
const openPalette = () => {
  if (!palette || palette.open) return;
  input.value = "";
  active = 0;
  render();
  palette.showModal();
  input.focus();
};

opener?.addEventListener("click", openPalette);
input?.addEventListener("input", () => {
  active = 0;
  render();
});
input?.addEventListener("keydown", e => {
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    e.preventDefault();
    if (!shown.length) return;
    active = (active + (e.key === "ArrowDown" ? 1 : -1) + shown.length) % shown.length;
    highlight();
  } else if (e.key === "Enter") {
    e.preventDefault();
    choose(active);
  }
});
// A click on the backdrop (outside the box) closes it.
palette?.addEventListener("click", e => {
  if (e.target === palette) palette.close();
});
palette?.addEventListener("close", () => opener?.focus({ preventScroll: true }));
document.addEventListener("keydown", e => {
  const typing = e.target instanceof HTMLElement && (e.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName));
  if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
    e.preventDefault();
    openPalette();
  } else if (e.key === "/" && !typing) {
    e.preventDefault();
    openPalette();
  }
});
