"use client";

import { Terminal } from "@/components/terminal";
import { HERO_BADGE, PROFILE } from "@/data/resume";
import { ArrowDown, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const ease = (t: number) => 1 - Math.pow(1 - t, 3);
const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

// Scroll progress through the tall hero section, 0 at the top and 1 when it has scrolled past.
// null means "don't animate": before hydration, without JS, or with reduced motion.
function useHeroProgress() {
  const ref = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  // Sticky: true once the visitor has scrolled into the hero, so the terminal stops its intro for good.
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const r = el.getBoundingClientRect();
      const p = clamp(-r.top / Math.max(1, r.height - window.innerHeight));
      setProgress(p);
      if (p > 0.04) setScrolled(true);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
  return { ref, progress, scrolled };
}

export function Hero() {
  const { ref, progress, scrolled } = useHeroProgress();
  const animated = progress !== null;
  // First 35% of the scroll: text fades back while the terminal slides up and grows.
  const t = animated ? ease(clamp(progress / 0.35)) : 0;

  return (
    <section ref={ref} id="top" className={animated ? "relative h-[230svh]" : "relative"}>
      <div className={animated ? "sticky top-0 h-svh overflow-hidden" : "relative overflow-hidden pb-16"}>
        <div aria-hidden className="aurora pointer-events-none absolute inset-x-0 top-[10%] h-[80%]" />
        <div aria-hidden className="dot-grid pointer-events-none absolute inset-0" />

        <div
          className="relative mx-auto flex max-w-3xl flex-col items-center px-5 pt-24 text-center sm:pt-28"
          style={animated ? { opacity: 1 - t * 1.4, transform: `translateY(${-t * 80}px) scale(${1 - t * 0.06})` } : undefined}
        >
          <p
            className="rise inline-flex items-center gap-2.5 rounded-full border border-line bg-canvas/60 px-4 py-1.5 text-[13px] backdrop-blur sm:text-[15px]"
            style={delay(0)}
          >
            <span className="flex items-center gap-2 font-medium text-accent">
              <span className="pulse-dot size-2 rounded-full bg-accent" />
              {HERO_BADGE.status}
            </span>
            <span aria-hidden className="h-4 w-px bg-line" />
            <span className="text-ink/90">{HERO_BADGE.tags}</span>
          </p>
          <h1
            className="rise mt-7 text-[clamp(2.6rem,8vw,4.5rem)] leading-[1.02] font-semibold tracking-[-0.045em] text-ink"
            style={delay(80)}
          >
            {PROFILE.name}
          </h1>
          <p className="rise text-gradient mt-4 text-xl font-semibold tracking-[-0.02em] sm:text-[28px]" style={delay(160)}>
            {PROFILE.role}
          </p>
          <p className="rise mt-6 max-w-2xl text-[17px] leading-[1.75] text-pretty sm:text-xl" style={delay(240)}>
            I build sales and service systems on <b className="font-medium text-ink">Oracle Cloud</b> at{" "}
            <b className="font-medium text-ink">Deloitte</b>, and after hours I ship my own products:{" "}
            <b className="font-medium text-ink">Duely</b>, <b className="font-medium text-ink">Roamly</b> and{" "}
            <b className="font-medium text-ink">Tailor</b>, all live.
          </p>
          <div className="rise mt-9 flex flex-wrap items-center justify-center gap-x-8 gap-y-4" style={delay(320)}>
            <a
              href="#work"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-[17px] font-medium text-on-accent transition-transform hover:scale-[1.03]"
            >
              <ArrowDown className="size-[18px]" aria-hidden />
              See my work
            </a>
            <a href="#contact" className="group inline-flex items-center gap-1 text-[17px] font-medium text-accent">
              Get in touch
              <ChevronRight className="size-[18px] transition-transform group-hover:translate-x-0.5" aria-hidden />
            </a>
          </div>
        </div>

        {/* The wrapper spans the screen, so only the terminal itself takes clicks. */}
        <div
          className={
            animated
              ? "pointer-events-none absolute inset-x-0 top-0 flex h-svh items-center px-4 pt-12 sm:px-8"
              : "relative mt-16 px-4 sm:px-8"
          }
          style={animated ? { transform: `translateY(${(1 - t) * 66}svh) scale(${0.92 + t * 0.08})` } : undefined}
        >
          <div className="pointer-events-auto w-full">
            <Terminal finish={scrolled} />
          </div>
        </div>
      </div>
    </section>
  );
}
