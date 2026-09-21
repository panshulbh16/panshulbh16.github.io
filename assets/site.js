(() => {
  const root = document.documentElement;
  const toggle = document.getElementById("theme-toggle");
  const stored = localStorage.getItem("theme");
  if (stored === "light" || stored === "dark") {
    root.dataset.theme = stored;
  } else if (window.matchMedia("(prefers-color-scheme: light)").matches) {
    root.dataset.theme = "light";
  } else {
    root.dataset.theme = "dark";
  }

  const label = () => {
    if (!toggle) return;
    toggle.textContent = root.dataset.theme === "light" ? "Use dark theme" : "Use light theme";
    toggle.setAttribute("aria-pressed", root.dataset.theme === "light" ? "true" : "false");
  };
  label();
  toggle?.addEventListener("click", () => {
    root.dataset.theme = root.dataset.theme === "light" ? "dark" : "light";
    localStorage.setItem("theme", root.dataset.theme);
    label();
  });

  const links = [...document.querySelectorAll(".section-nav a")];
  const sections = links
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);

  const setCurrent = (id) => {
    links.forEach((a) => {
      const on = a.getAttribute("href") === `#${id}`;
      if (on) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
  };

  if ("IntersectionObserver" in window && sections.length) {
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setCurrent(visible.target.id);
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0.15, 0.35, 0.6] }
    );
    sections.forEach((s) => io.observe(s));
  }

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
})();
