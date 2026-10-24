"use client";

import { BrandIcon, OracleMark } from "@/components/brand-icon";
import { SKILL_GROUPS, SKILLS, type SkillGroup } from "@/data/resume";
import { cn } from "@/lib/utils";
import { useState } from "react";

type Filter = "All" | SkillGroup;

export function SkillsGrid() {
  const [filter, setFilter] = useState<Filter>("All");
  const shown = filter === "All" ? SKILLS : SKILLS.filter((s) => s.group === filter);

  return (
    <>
      <div
        role="group"
        aria-label="Filter skills"
        className="mx-auto flex w-fit max-w-full flex-wrap justify-center gap-1 rounded-xl bg-muted p-1"
      >
        {(["All", ...SKILL_GROUPS] as Filter[]).map((g) => (
          <button
            key={g}
            type="button"
            aria-pressed={filter === g}
            onClick={() => setFilter(g)}
            className={cn(
              "rounded-lg px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-all hover:text-foreground",
              filter === g && "bg-surface text-foreground shadow-soft"
            )}
          >
            {g}
          </button>
        ))}
      </div>

      <ul className="mt-8 grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-5">
        {shown.map((s) => (
          <li
            key={s.name}
            className="group flex flex-col items-center gap-2.5 rounded-xl border bg-background/60 px-2 py-4 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-medium sm:gap-3 sm:px-3 sm:py-5"
          >
            <span className="grid size-10 place-items-center rounded-xl border bg-white shadow-soft transition-transform duration-200 group-hover:scale-105 sm:size-12">
              {s.icon ? (
                <BrandIcon icon={s.icon} colored className="size-6 sm:size-7" />
              ) : s.oracle ? (
                <OracleMark className="size-7 sm:size-8" />
              ) : null}
            </span>
            <span className="text-xs leading-tight font-medium sm:text-sm">{s.name}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
