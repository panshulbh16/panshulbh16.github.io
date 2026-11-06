"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";

function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Paragraphs whose words light up from faint to ink as they cross the middle of the screen.
// Server HTML (and reduced motion) shows everything fully lit.
export function ScrollWords({ paragraphs, className }: { paragraphs: string[]; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(1);
  const words = paragraphs.map((p) => p.split(" "));
  const total = words.reduce((n, w) => n + w.length, 0);

  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion()) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 when the block's top is at 85% of the viewport, 1 when its bottom reaches 45%.
      setProgress(Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.4))));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const lit = Math.round(progress * total);
  let i = 0;
  return (
    <div ref={ref} className={className}>
      {words.map((ws, pi) => (
        <p key={pi} className={pi === 0 ? "text-ink" : "mt-8"}>
          {ws.map((w, wi) => {
            const on = pi === 0 || i++ < lit;
            return (
              <span key={wi} className={cn("transition-colors duration-300", pi > 0 && (on ? "text-ink" : "text-ink/20"))}>
                {w}{" "}
              </span>
            );
          })}
        </p>
      ))}
    </div>
  );
}

// Steps that tick themselves off, one after another, once the list scrolls into view.
export function Checklist({ steps }: { steps: string[] }) {
  const ref = useRef<HTMLOListElement>(null);
  const [done, setDone] = useState(steps.length);

  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion()) return;
    setDone(0);
    let timer: ReturnType<typeof setInterval> | undefined;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        timer = setInterval(() => {
          setDone((d) => {
            if (d + 1 >= steps.length) clearInterval(timer);
            return d + 1;
          });
        }, 450);
      },
      { rootMargin: "0px 0px -25% 0px" }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      clearInterval(timer);
    };
  }, [steps.length]);

  return (
    <ol ref={ref} className="space-y-3" aria-label="How it works">
      {steps.map((s, i) => {
        const on = i < done;
        const current = i === done;
        return (
          <li key={s} className="flex items-center gap-3.5 text-[15px] text-ink">
            <span
              aria-hidden
              className={cn(
                "grid size-6 shrink-0 place-items-center rounded-full transition-all duration-500",
                on ? "bg-accent text-on-accent" : current ? "bg-accent/25 ring-2 ring-accent/60" : "bg-ink/15"
              )}
            >
              <Check className={cn("size-3.5 transition-opacity", on ? "opacity-100" : "opacity-0")} strokeWidth={3} />
            </span>
            {s}
          </li>
        );
      })}
    </ol>
  );
}
