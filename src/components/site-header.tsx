"use client";

import { NAV, PROFILE } from "@/data/resume";
import { cn } from "@/lib/utils";
import { Briefcase, House, Layers, LayoutGrid, Mail, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const DOCK_ICONS = { home: House, experience: Briefcase, skills: Layers, projects: LayoutGrid, contact: Mail };

// Highlights the section currently in the middle band of the screen.
function useActiveSection() {
  const [active, setActive] = useState<string>("home");
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    for (const { id } of NAV) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);
  return active;
}

function ThemeToggle() {
  // resolvedTheme, not theme: theme stays "system" until the first click.
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <button
      type="button"
      aria-label="Toggle light and dark theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="grid size-10 place-items-center rounded-full text-foreground transition-colors hover:bg-muted"
    >
      <Moon className="size-[18px] dark:hidden" aria-hidden />
      <Sun className="hidden size-[18px] dark:block" aria-hidden />
    </button>
  );
}

export function SiteHeader() {
  const active = useActiveSection();
  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5 sm:px-8">
          <a href="#home" className="font-display text-lg font-semibold tracking-[-0.025em]">
            {PROFILE.name}
          </a>
          <nav aria-label="Sections" className="hidden items-center gap-1 md:flex">
            {NAV.map(({ id, label }) => (
              <a
                key={id}
                href={`#${id}`}
                aria-current={active === id ? "true" : undefined}
                className={cn(
                  "rounded-full px-4 py-2 text-[15px] font-medium text-muted-foreground transition-colors hover:text-foreground",
                  active === id && "bg-muted text-foreground"
                )}
              >
                {label}
              </a>
            ))}
          </nav>
          <ThemeToggle />
        </div>
      </header>

      {/* Phones get a thumb-reach dock instead of the top links. */}
      <nav
        aria-label="Sections"
        className="fixed inset-x-0 bottom-4 z-40 mx-auto flex w-fit items-center gap-1 rounded-2xl border bg-surface/90 p-1.5 shadow-strong backdrop-blur-md md:hidden"
      >
        {NAV.map(({ id, label }) => {
          const Icon = DOCK_ICONS[id];
          return (
            <a
              key={id}
              href={`#${id}`}
              aria-label={label}
              aria-current={active === id ? "true" : undefined}
              className={cn(
                "grid size-11 place-items-center rounded-xl text-muted-foreground transition-colors",
                active === id && "bg-foreground text-background"
              )}
            >
              <Icon className="size-[19px]" aria-hidden />
            </a>
          );
        })}
      </nav>
    </>
  );
}
