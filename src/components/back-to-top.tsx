"use client";

import { cn } from "@/lib/utils";
import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

export function BackToTop() {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > 700);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <a
      href="#home"
      aria-label="Back to top"
      tabIndex={shown ? 0 : -1}
      className={cn(
        "fixed right-5 bottom-24 z-40 grid size-12 place-items-center rounded-full bg-foreground text-background shadow-strong transition-all duration-300 hover:-translate-y-0.5 md:right-8 md:bottom-8 md:size-14",
        shown ? "opacity-100" : "pointer-events-none translate-y-3 opacity-0"
      )}
    >
      <ArrowUp className="size-5" aria-hidden />
    </a>
  );
}
