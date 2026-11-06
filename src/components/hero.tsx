"use client";

import { HERO_BADGE, PROFILE, TERMINAL } from "@/data/resume";
import { ArrowDown, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";

const COMMAND = `describe engineer ${PROFILE.handle}`;
const clamp = (v: number) => Math.min(1, Math.max(0, v));
const ease = (t: number) => 1 - Math.pow(1 - t, 3);
const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

// Scroll progress through the tall hero section, 0 at the top and 1 when it has scrolled past.
// null means "don't animate": before hydration, without JS, or with reduced motion.
function useHeroProgress() {
  const ref = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const r = el.getBoundingClientRect();
      setProgress(clamp(-r.top / Math.max(1, r.height - window.innerHeight)));
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
  return { ref, progress };
}

function Terminal({ progress }: { progress: number | null }) {
  const animated = progress !== null;
  const p = progress ?? 1;
  const typed = animated ? Math.round(clamp((p - 0.18) / 0.12) * COMMAND.length) : COMMAND.length;
  const lines = animated ? Math.floor(clamp((p - 0.32) / 0.42) * (TERMINAL.length + 0.999)) : TERMINAL.length;
  const done = lines >= TERMINAL.length;

  return (
    <div
      role="img"
      aria-label={`Terminal: ${TERMINAL.map(([k, v]) => `${k}: ${v}`).join(". ")}`}
      className="mx-auto flex h-[min(72svh,560px)] w-full max-w-content flex-col overflow-hidden rounded-[22px] border border-line bg-panel shadow-[0_40px_120px_-30px_rgb(0_0_0/0.6)]"
    >
      <div aria-hidden className="relative flex h-11 shrink-0 items-center border-b border-line bg-panel-2/60 px-4">
        <span className="flex gap-2">
          <span className="size-3 rounded-full bg-[#ff5f57]" />
          <span className="size-3 rounded-full bg-[#febc2e]" />
          <span className="size-3 rounded-full bg-[#28c840]" />
        </span>
        <span className="absolute inset-x-0 text-center font-mono text-[12px] text-faint">
          {PROFILE.handle}@bengaluru: ~ — zsh
        </span>
      </div>
      <div aria-hidden className="flex-1 overflow-hidden p-5 font-mono text-[13px] leading-[2] sm:p-7 sm:text-[17px]">
        <p className="text-ink">
          <span className="text-accent">➜</span> <span className="text-[rgb(var(--g2))]">~</span>{" "}
          {COMMAND.slice(0, typed)}
          {typed < COMMAND.length && <span className="caret ml-px inline-block h-[1.1em] w-[0.55em] translate-y-[3px] bg-ink" />}
        </p>
        <dl className="mt-2">
          {TERMINAL.slice(0, lines).map(([k, v, accent]) => (
            <div key={k} className="grid grid-cols-[7.5rem_1fr] gap-x-3 sm:grid-cols-[10rem_1fr]">
              <dt className="text-faint">{k}</dt>
              <dd className={accent ? "text-accent" : "text-ink"}>
                {accent && <span className="pulse-dot mr-2 inline-block size-2 -translate-y-px rounded-full bg-accent" />}
                {v}
              </dd>
            </div>
          ))}
        </dl>
        {done && (
          <p className="mt-3 text-ink">
            <span className="text-accent">➜</span> <span className="text-[rgb(var(--g2))]">~</span>{" "}
            <span className="caret inline-block h-[1.1em] w-[0.55em] translate-y-[3px] bg-ink" />
          </p>
        )}
        {animated && !done && <p className="mt-3 text-faint">↓ scroll</p>}
      </div>
    </div>
  );
}

export function Hero() {
  const { ref, progress } = useHeroProgress();
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
            <b className="font-medium text-ink">Duely</b>, <b className="font-medium text-ink">Roamly</b>,{" "}
            <b className="font-medium text-ink">Tailor</b> and <b className="font-medium text-ink">Opportunity Hunter</b>
            , all live.
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

        <div
          className={animated ? "absolute inset-x-0 top-0 flex h-svh items-center px-4 pt-12 sm:px-8" : "relative mt-16 px-4 sm:px-8"}
          style={animated ? { transform: `translateY(${(1 - t) * 66}svh) scale(${0.92 + t * 0.08})` } : undefined}
        >
          <Terminal progress={progress} />
        </div>
      </div>
    </section>
  );
}
