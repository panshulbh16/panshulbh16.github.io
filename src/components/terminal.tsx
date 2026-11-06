"use client";

import { smashThisPage } from "@/components/smash-button";
import { NAV, PROFILE, PROJECTS, TERMINAL } from "@/data/resume";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent, type ReactNode } from "react";

type Entry = { id: number; input: string; output: ReactNode };

const INTRO = `describe engineer ${PROFILE.handle}`;
const SECTIONS = NAV.map((n) => n.id) as readonly string[];
const slug = (s: string) => s.toLowerCase().trim().replace(/\s+/g, "-");
const COMMANDS = [
  "help",
  "ls",
  "whoami",
  "projects",
  ...SECTIONS,
  ...PROJECTS.map((p) => slug(p.title)),
  "smash",
  "email",
  "linkedin",
  "github",
  "theme",
  "clear",
];

const REDUCE = "(prefers-reduced-motion: reduce)";
function subscribeReduce(cb: () => void) {
  const mq = window.matchMedia(REDUCE);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
const useReducedMotion = () =>
  useSyncExternalStore(subscribeReduce, () => window.matchMedia(REDUCE).matches, () => false);

// Scrolls to a section the same way a nav link does.
function goTo(id: string) {
  if (window.location.hash === `#${id}`) document.getElementById(id)?.scrollIntoView();
  else window.location.hash = id;
}

function openInNewTab(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

async function copyEmail() {
  try {
    await navigator.clipboard.writeText(PROFILE.email);
    return true;
  } catch {
    return false;
  }
}

const Dim = ({ children }: { children: ReactNode }) => <span className="text-faint">{children}</span>;
const Cmd = ({ children }: { children: ReactNode }) => <span className="text-[rgb(var(--g2))]">{children}</span>;

function Prompt() {
  return (
    <span aria-hidden className="select-none">
      <span className="text-accent">➜</span>
      <span className="text-[rgb(var(--g2))]">{" ~ "}</span>
    </span>
  );
}

function Describe({ lines = TERMINAL.length }: { lines?: number }) {
  return (
    <dl>
      {TERMINAL.slice(0, lines).map(([k, v, accent]) => (
        <div key={k} className="grid grid-cols-[6.75rem_minmax(0,1fr)] gap-x-3 sm:grid-cols-[8.5rem_minmax(0,1fr)]">
          <dt className="text-faint">{k}</dt>
          <dd className={accent ? "text-accent" : "text-ink"}>
            {accent && <span className="pulse-dot mr-2 inline-block size-2 -translate-y-px rounded-full bg-accent" />}
            {v}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Table({ rows }: { rows: [ReactNode, ReactNode][] }) {
  return (
    // Phones: fixed split so long command lists wrap instead of crushing the description column.
    <dl className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] gap-x-4 sm:grid-cols-[auto_minmax(0,1fr)]">
      {rows.map(([k, v], i) => (
        <div key={i} className="contents">
          <dt>
            <Cmd>{k}</Cmd>
          </dt>
          <dd className="text-faint">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

// A small zsh: it types `describe engineer panshul` on load, then takes real commands.
// `finish` skips straight to the finished intro: the hero sets it, for good, once the visitor scrolls.
export function Terminal({ finish }: { finish: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [typed, setTyped] = useState(0);
  const [lines, setLines] = useState(0);
  const [cleared, setCleared] = useState(false);
  const [log, setLog] = useState<Entry[]>([]);
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const history = useRef<string[]>([]);
  const cursor = useRef(-1);
  const nextId = useRef(0);

  // With reduced motion, or once the visitor scrolls, the intro is simply there.
  const skip = useReducedMotion() || finish;
  const shownTyped = skip ? INTRO.length : typed;
  const shownLines = skip ? TERMINAL.length : lines;

  // Type the intro command a key at a time, then print its output a line at a time.
  useEffect(() => {
    if (skip) return;
    if (typed < INTRO.length) {
      const t = window.setTimeout(() => setTyped((n) => n + 1), typed === 0 ? 700 : 30 + Math.random() * 40);
      return () => window.clearTimeout(t);
    }
    if (lines < TERMINAL.length) {
      const t = window.setTimeout(() => setLines((n) => n + 1), lines === 0 ? 260 : 70);
      return () => window.clearTimeout(t);
    }
  }, [skip, typed, lines]);

  // New output: keep the prompt in view inside the terminal (never scrolls the page).
  useEffect(() => {
    const el = body.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [log, shownLines]);

  const introDone = shownTyped >= INTRO.length && shownLines >= TERMINAL.length;

  function appendNote(text: string) {
    setLog((l) => [...l, { id: nextId.current++, input: "", output: <Dim>{text}</Dim> }]);
  }

  function respond(raw: string): ReactNode {
    const words = raw.trim().split(/\s+/);
    const [cmd = "", ...args] = words.map((w) => w.toLowerCase());
    const target = slug((cmd === "cd" || cmd === "open" ? args : [cmd, ...args]).join(" "))
      .replace(/^~?\/?/, "")
      .replace(/\/$/, "");

    if (SECTIONS.includes(target)) {
      goTo(target);
      return <Dim>→ ~/{target}</Dim>;
    }
    const project = PROJECTS.find((p) => slug(p.title) === target);
    if (project) {
      const external = project.href.startsWith("http");
      openInNewTab(project.href);
      return <Dim>Opening {external ? new URL(project.href).hostname.replace(/^www\./, "") : project.title} ↗</Dim>;
    }

    if (target === "projects" && cmd !== "projects") return respond("projects");

    switch (cmd) {
      case "":
        return null;
      case "cd":
      case "open":
        return target === "" || target === "~" ? null : `${cmd}: no such file or directory: ${args.join(" ")}`;
      case "help":
        return (
          <Table
            rows={[
              [SECTIONS.join("  "), "jump to a section"],
              ["projects", "what I've shipped"],
              [PROJECTS.filter((p) => !p.extension).map((p) => slug(p.title)).join("  "), "open a product"],
              ["smash", "smash this page (Page Destroyer)"],
              ["email", "copy my email address"],
              ["linkedin, github", "open my profiles"],
              ["theme", "switch light / dark"],
              ["ls, whoami, clear", "the usual"],
            ]}
          />
        );
      case "ls":
        if (args[0]?.replace(/\/$/, "") === "projects") return respond("projects");
        return (
          <span>
            {SECTIONS.map((s) => (
              <span key={s} className="mr-3 text-[rgb(var(--g3))]">
                {s}/
              </span>
            ))}
            <span className="text-[rgb(var(--g3))]">projects/</span>
          </span>
        );
      case "projects":
        return (
          <Table
            rows={PROJECTS.map((p) => [
              slug(p.title),
              `${p.category} · ${p.href.startsWith("http") ? new URL(p.href).hostname.replace(/^www\./, "") : "Chrome"}`,
            ])}
          />
        );
      case "whoami":
        return `${PROFILE.name}, ${PROFILE.role}`;
      case "pwd":
        return `/home/${PROFILE.handle}`;
      case "describe":
        return <Describe />;
      case "echo":
        return raw.trim().slice(4).trim();
      case "email":
      case "mail":
        void copyEmail().then((ok) => appendNote(ok ? `Copied ${PROFILE.email}` : PROFILE.email));
        return null;
      case "linkedin":
      case "github":
        openInNewTab(cmd === "linkedin" ? PROFILE.linkedin : PROFILE.github);
        return <Dim>Opening {cmd === "linkedin" ? "LinkedIn" : "GitHub"} ↗</Dim>;
      case "theme": {
        const want = args[0] === "light" || args[0] === "dark" ? args[0] : resolvedTheme === "dark" ? "light" : "dark";
        setTheme(want);
        return <Dim>Theme: {want}</Dim>;
      }
      case "smash":
        smashThisPage();
        return <Dim>Smash away. Press Esc to put the page back.</Dim>;
      case "sudo":
        return `${PROFILE.handle} is not in the sudoers file. This incident will be reported.`;
      default:
        return (
          <span>
            zsh: command not found: {words[0]}. Type <Cmd>help</Cmd>.
          </span>
        );
    }
  }

  function clear() {
    setLog([]);
    setCleared(true);
  }

  function run() {
    const raw = value;
    setValue("");
    cursor.current = -1;
    if (raw.trim()) history.current.unshift(raw.trim());
    if (/^(clear|cls)$/i.test(raw.trim())) return clear();
    const output = respond(raw);
    setLog((l) => [...l, { id: nextId.current++, input: raw.trim(), output }]);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      run();
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const h = history.current;
      cursor.current = e.key === "ArrowUp" ? Math.min(cursor.current + 1, h.length - 1) : Math.max(cursor.current - 1, -1);
      setValue(cursor.current >= 0 ? h[cursor.current] : "");
    } else if (e.key === "Tab" && value.trim()) {
      // Only take Tab when it completes something, so keyboard users can still tab past the terminal.
      const matches = COMMANDS.filter((c) => c.startsWith(value.trim().toLowerCase()));
      if (matches.length === 1) {
        e.preventDefault();
        setValue(matches[0]);
      }
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      clear();
    }
  }

  // Clicking anywhere in the window focuses the prompt, unless the visitor is selecting text.
  function focusPrompt() {
    if (window.getSelection()?.toString()) return;
    input.current?.focus({ preventScroll: true });
  }

  return (
    <div
      onClick={focusPrompt}
      className="mx-auto flex h-[min(72svh,560px)] w-full max-w-content flex-col overflow-hidden rounded-[22px] border border-line bg-panel shadow-[0_40px_120px_-30px_rgb(0_0_0/0.6)] ring-accent/40 transition-shadow focus-within:ring-2"
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

      <div
        ref={body}
        className="min-h-0 flex-1 overflow-y-auto p-5 font-mono text-[13px] leading-[1.8] text-ink [scrollbar-width:thin] sm:p-7 sm:text-[15px]"
      >
        {!cleared && (
          <>
            <div aria-hidden>
              <p className="break-words">
                <Prompt />
                {INTRO.slice(0, shownTyped)}
                {shownTyped < INTRO.length && (
                  <span className="caret ml-px inline-block h-[1.1em] w-[0.55em] translate-y-[3px] bg-ink" />
                )}
              </p>
              {shownLines > 0 && (
                <div className="mt-1">
                  <Describe lines={shownLines} />
                </div>
              )}
            </div>
            <div className="sr-only">
              <p>Terminal. Output of {INTRO}:</p>
              <Describe />
            </div>
          </>
        )}

        <div role="log" aria-live="polite" aria-label="Terminal output">
          {log.map((e) => (
            <div key={e.id} className="mt-1.5">
              {e.input && (
                <p className="break-words">
                  <Prompt />
                  {e.input}
                </p>
              )}
              {e.output && <div className="break-words">{e.output}</div>}
            </div>
          ))}
        </div>

        <div className={introDone ? "mt-1.5 flex items-center" : "invisible mt-1.5 flex items-center"}>
          <Prompt />
          <label htmlFor="terminal-input" className="sr-only">
            Terminal command. Type help to see what it can do.
          </label>
          <span className="relative min-w-0 flex-1">
            <input
              ref={input}
              id="terminal-input"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={onKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="send"
              className="w-full bg-transparent text-[16px] text-ink caret-accent outline-none focus-visible:outline-none sm:text-[15px]"
            />
            {!focused && !value && (
              <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 flex items-center text-faint">
                <span className="caret mr-2 inline-block h-[1.1em] w-[0.55em] bg-accent" />
                type <span className="mx-1 text-ink">help</span> or scroll
              </span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
