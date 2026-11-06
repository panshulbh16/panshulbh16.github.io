"use client";

import { NAV, PROFILE } from "@/data/resume";
import { cn } from "@/lib/utils";
import { ChevronDown, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

function useScrolled() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return scrolled;
}

function ThemeToggle() {
  // resolvedTheme, not theme: theme stays "system" until the first click.
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <button
      type="button"
      aria-label="Toggle light and dark theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="grid size-9 place-items-center rounded-full text-ink transition-colors hover:bg-ink/10"
    >
      <Moon className="size-[18px] dark:hidden" aria-hidden />
      <Sun className="hidden size-[18px] dark:block" aria-hidden />
    </button>
  );
}

export function SiteHeader() {
  const scrolled = useScrolled();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300",
        scrolled || open ? "border-line bg-canvas/80 backdrop-blur-xl" : "border-transparent"
      )}
    >
      <nav aria-label="Main" className="mx-auto flex h-12 max-w-content items-center justify-between gap-3 px-5 sm:px-8">
        <a href="#top" className="truncate text-[17px] font-semibold tracking-[-0.02em] text-ink">
          {PROFILE.name}
        </a>
        <div className="hidden items-center gap-6 md:flex">
          {NAV.map(({ id, label }) => (
            <a key={id} href={`#${id}`} className="text-[13px] text-mute transition-colors hover:text-ink">
              {label}
            </a>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          <a
            href="#contact"
            className="hidden whitespace-nowrap rounded-full bg-accent px-4 py-1.5 text-[13px] font-medium text-on-accent transition-opacity hover:opacity-90 sm:inline-block"
          >
            Get in touch
          </a>
          <button
            type="button"
            aria-label="Sections"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((o) => !o)}
            className="grid size-9 place-items-center rounded-full text-ink hover:bg-ink/10 md:hidden"
          >
            <ChevronDown className={cn("size-[18px] transition-transform", open && "rotate-180")} aria-hidden />
          </button>
        </div>
      </nav>
      {open && (
        <ul id="mobile-menu" className="mx-auto max-w-content px-5 pb-4 md:hidden">
          {NAV.map(({ id, label }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                onClick={() => setOpen(false)}
                className="block border-b border-line py-3 text-2xl font-semibold tracking-[-0.02em] text-ink"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}
