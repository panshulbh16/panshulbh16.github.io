"use client";

import { Hammer } from "lucide-react";

// Same as wireDestroyButtons() in public/page-destroyer/store.js, but wired by React so an
// early click works without waiting for store.js. No data-destroy-here: store.js would add a
// second listener, and loading the script twice toggles the destroyer straight back off.
function smashThisPage() {
  const s = document.createElement("script");
  s.src = "/page-destroyer/destroyer.js";
  s.onload = s.onerror = () => s.remove();
  document.body.appendChild(s);
}

export function SmashButton() {
  return (
    <button
      type="button"
      onClick={smashThisPage}
      className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg bg-foreground px-3 py-1.5 text-sm font-medium text-background transition-transform hover:-translate-y-0.5"
    >
      <Hammer className="size-3.5" aria-hidden />
      Smash this page
    </button>
  );
}
