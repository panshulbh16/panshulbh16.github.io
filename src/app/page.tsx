/* eslint-disable @next/next/no-img-element */
import { BrandIcon, LinkedInIcon } from "@/components/brand-icon";
import { SkillsGrid } from "@/components/skills-grid";
import { SmashButton } from "@/components/smash-button";
import { EXPERIENCE, PROFILE, PROJECTS, type Experience, type Project } from "@/data/resume";
import { cn } from "@/lib/utils";
import { ArrowRight, ArrowUpRight, Calendar, Download, Globe, Mail, MapPin } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { siGithub } from "simple-icons";

const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

function ExtLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}

function SectionHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="reveal mb-14 text-center">
      <h2 className="font-display text-4xl font-bold tracking-[-0.035em] sm:text-5xl">{title}</h2>
      <p className="mt-3 text-lg text-muted-foreground">{subtitle}</p>
    </div>
  );
}

// Types the tagline one character at a time in CSS. The full text is in the HTML for
// screen readers and search, and shows at once under reduced motion.
function Typewriter({ text }: { text: string }) {
  return (
    <p aria-label={text} className="text-lg font-medium text-muted-foreground text-balance sm:text-2xl">
      <span aria-hidden>
        {[...text].map((ch, i) => (
          <span key={i} className="type-char" style={{ "--i": i } as CSSProperties}>
            {ch}
          </span>
        ))}
      </span>
      <span aria-hidden className="caret ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[3px] bg-current" />
    </p>
  );
}

function Avatar() {
  return (
    <div className="rise relative" style={delay(0)}>
      <div aria-hidden className="absolute -inset-6 rounded-full bg-brand/25 blur-2xl dark:bg-brand/20" />
      <div className="avatar-ring relative rounded-full p-[3px] shadow-strong">
        <div className="grid size-28 place-items-center overflow-hidden rounded-full border-[3px] border-background bg-surface sm:size-32">
          {PROFILE.avatarUrl ? (
            <img src={PROFILE.avatarUrl} alt={PROFILE.name} className="size-full object-cover" />
          ) : (
            <span className="font-display text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
              {PROFILE.initials}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

const inlineLink = "font-semibold text-foreground underline decoration-2 underline-offset-4 hover:text-brand";

function Hero() {
  return (
    <section id="home" className="relative flex min-h-[calc(100svh-72px)] items-center justify-center overflow-hidden py-16">
      {/* Faint dot grid fading out from the top, plus a warm glow behind the name. */}
      <div
        aria-hidden
        className="absolute inset-0 [background-image:radial-gradient(var(--border)_1px,transparent_1.2px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_30%,black,transparent)]"
      />
      <div className="relative mx-auto flex max-w-3xl flex-col items-center px-5 text-center">
        <Avatar />
        <p
          className="rise mt-6 inline-flex items-center gap-1.5 rounded-full border bg-surface/80 px-3 py-1 text-sm font-medium text-muted-foreground shadow-soft"
          style={delay(80)}
        >
          <MapPin className="size-3.5 text-brand" aria-hidden />
          {PROFILE.location}
        </p>
        <h1
          className="rise mt-5 font-display text-5xl leading-[0.95] font-bold tracking-[-0.045em] sm:text-7xl"
          style={delay(140)}
        >
          {PROFILE.name}
        </h1>
        <div className="mt-5">
          <Typewriter text={PROFILE.tagline} />
        </div>

        <div
          className="rise mt-9 rounded-2xl border bg-surface/85 p-6 text-left text-[17px] leading-relaxed text-foreground/80 shadow-soft backdrop-blur-sm sm:p-7"
          style={delay(260)}
        >
          <p>
            I build on Oracle Cloud for a living: I&apos;m a technology consultant in{" "}
            <ExtLink href="https://www.deloitte.com/" className={inlineLink}>
              Deloitte
            </ExtLink>
            &apos;s Oracle CX practice, designing Redwood systems for companies in the US and Canada, after
            almost four years as a software engineer at SoftClouds.
          </p>
          <p className="mt-4">
            Outside work I build my own products end to end.{" "}
            <ExtLink href="https://heyduely.com/" className={inlineLink}>
              Duely
            </ExtLink>
            ,{" "}
            <ExtLink href="https://heyroamly.com/" className={inlineLink}>
              Roamly
            </ExtLink>
            ,{" "}
            <ExtLink href="https://tailor-production-6d17.up.railway.app/" className={inlineLink}>
              Tailor
            </ExtLink>{" "}
            and{" "}
            <ExtLink href="https://opportunityhunter.xyz/" className={inlineLink}>
              Opportunity Hunter
            </ExtLink>{" "}
            are all live.
          </p>
        </div>

        <div className="rise mt-8 flex gap-3" style={delay(340)}>
          {[
            { label: "GitHub", href: PROFILE.github, icon: <BrandIcon icon={siGithub} className="size-5" /> },
            { label: "LinkedIn", href: PROFILE.linkedin, icon: <LinkedInIcon className="size-[18px]" /> },
            { label: "Email", href: `mailto:${PROFILE.email}`, icon: <Mail className="size-5" aria-hidden /> },
          ].map((s) => (
            <a
              key={s.label}
              href={s.href}
              aria-label={s.label}
              {...(s.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="grid size-12 place-items-center rounded-full border bg-surface shadow-soft transition-all hover:-translate-y-0.5 hover:text-brand hover:shadow-medium"
            >
              {s.icon}
            </a>
          ))}
        </div>

        <div className="rise mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row" style={delay(420)}>
          <a
            href="#projects"
            className="group inline-flex items-center justify-center gap-2 rounded-[10px] bg-foreground px-8 py-3 text-lg font-medium text-background shadow-medium transition-transform hover:-translate-y-0.5"
          >
            Check My Work
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </a>
          <a
            href={`mailto:${PROFILE.email}`}
            className="inline-flex items-center justify-center gap-2 rounded-[10px] border bg-background px-8 py-3 text-lg font-medium transition-colors hover:bg-surface"
          >
            Get In Touch
            <ArrowUpRight className="size-4" aria-hidden />
          </a>
        </div>
      </div>
    </section>
  );
}

function OrgMark({ mark }: { mark: Experience["mark"] }) {
  return (
    <span
      aria-hidden
      className="relative grid size-12 shrink-0 place-items-center rounded-xl font-display text-xl font-bold shadow-soft ring-1 ring-foreground/10"
      style={{ background: mark.bg, color: mark.fg }}
    >
      {mark.letter}
      {mark.dot && <span className="absolute right-2 bottom-2.5 size-1.5 rounded-full" style={{ background: mark.dot }} />}
    </span>
  );
}

function Pill({ children }: { children: ReactNode }) {
  return (
    <li className="rounded-full border bg-background px-2.5 py-0.5 text-xs font-medium text-foreground/80">{children}</li>
  );
}

function ExperienceCard({ item }: { item: Experience }) {
  return (
    <article className="rounded-2xl border bg-surface p-6 shadow-soft transition-shadow duration-300 hover:shadow-medium">
      <header className="flex gap-4">
        <OrgMark mark={item.mark} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-lg font-semibold tracking-[-0.02em]">
              {item.href ? (
                <ExtLink href={item.href} className="inline-flex items-center gap-1 hover:text-brand">
                  {item.org}
                  <ArrowUpRight className="size-3.5 text-muted-foreground" aria-hidden />
                </ExtLink>
              ) : (
                item.org
              )}
            </h3>
            {item.badges.map((b) => (
              <span
                key={b.label}
                className={cn(
                  "rounded-md px-2 py-0.5 text-xs font-semibold",
                  b.tone === "brand" ? "bg-brand-soft text-brand" : "bg-muted text-foreground/80"
                )}
              >
                {b.label}
              </span>
            ))}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{item.meta}</p>
          {item.place && (
            <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="size-3.5" aria-hidden />
              {item.place}
            </p>
          )}
        </div>
      </header>

      {item.summary && <p className="mt-4 text-[15px] leading-relaxed text-foreground/80">{item.summary}</p>}

      {item.roles.map((role) => (
        <div key={role.title} className="relative mt-5 border-l-2 border-border pl-5">
          <span aria-hidden className="absolute top-[7px] -left-[5px] size-2 rounded-full bg-foreground" />
          <h4 className="flex flex-wrap items-center gap-2 font-display font-semibold tracking-[-0.015em]">
            {role.title}
            {role.badge && (
              <span className="rounded-md bg-muted px-2 py-0.5 font-sans text-xs font-semibold">{role.badge}</span>
            )}
          </h4>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="size-3.5" aria-hidden />
            {role.dates}
          </p>
          <ul className="mt-3 space-y-2 text-[15px] leading-relaxed text-foreground/80">
            {role.bullets.map((b) => (
              <li key={b} className="relative pl-4 before:absolute before:top-[0.6em] before:left-0 before:size-1.5 before:rounded-full before:bg-brand">
                {b}
              </li>
            ))}
          </ul>
        </div>
      ))}

      {(item.links?.length || item.tech.length > 0) && (
        <footer className="mt-5 border-t pt-4">
          {item.links && (
            <p className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium">
              {item.links.map((l) => (
                <ExtLink key={l.href} href={l.href} className="inline-flex items-center gap-0.5 hover:text-brand">
                  {l.label}
                  <ArrowUpRight className="size-3.5" aria-hidden />
                </ExtLink>
              ))}
            </p>
          )}
          {item.tech.length > 0 && (
            <ul className="flex flex-wrap gap-1.5" aria-label="Technologies">
              {item.tech.map((t) => (
                <Pill key={t}>{t}</Pill>
              ))}
            </ul>
          )}
        </footer>
      )}
    </article>
  );
}

function ExperienceSection() {
  return (
    <section id="experience" className="bg-muted/40 py-24">
      <div className="mx-auto max-w-3xl px-5">
        <SectionHeading title="Experience" subtitle="Oracle Cloud consulting, and products of my own" />
        <ol className="relative space-y-8 before:absolute before:top-2 before:bottom-2 before:left-[5px] before:w-px before:bg-border sm:before:left-[7px]">
          {EXPERIENCE.map((item) => (
            <li key={item.org} className="reveal relative pl-7 sm:pl-10">
              <span
                aria-hidden
                className="absolute top-7 left-0 size-[11px] rounded-full border-2 border-background bg-foreground ring-4 ring-muted/60 sm:size-[15px]"
              />
              <ExperienceCard item={item} />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function SkillsSection() {
  return (
    <section id="skills" className="py-24">
      <div className="mx-auto max-w-5xl px-5">
        <div className="reveal rounded-3xl border bg-surface p-6 shadow-soft sm:p-10">
          <SectionHeading title="Skills" subtitle="What I build with" />
          <SkillsGrid />
        </div>
      </div>
    </section>
  );
}

function ProjectCard({ p }: { p: Project }) {
  const external = p.href.startsWith("http");
  const target = external ? { target: "_blank", rel: "noopener noreferrer" } : {};
  const shownTech = p.tech.slice(0, 4);
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-surface shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-strong">
      {/* Screenshot in a small browser window, so each product reads as a live site. */}
      <a href={p.href} {...target} tabIndex={-1} aria-hidden className="block bg-muted/70 px-4 pt-4">
        <div className="overflow-hidden rounded-t-lg border border-b-0 bg-surface shadow-soft">
          <div className="flex items-center gap-1.5 border-b px-3 py-2">
            <span className="size-2 rounded-full bg-[#ff5f57]" />
            <span className="size-2 rounded-full bg-[#febc2e]" />
            <span className="size-2 rounded-full bg-[#28c840]" />
            <span className="ml-2 truncate rounded bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              {external ? new URL(p.href).hostname.replace(/^www\./, "") : "any page you're stuck on"}
            </span>
          </div>
          <div className="relative aspect-[16/9] overflow-hidden">
            <img
              src={p.image}
              alt={p.imageAlt}
              width={800}
              height={500}
              loading="lazy"
              decoding="async"
              className="size-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]"
            />
            <span className="absolute top-2.5 left-2.5 rounded-full bg-foreground/85 px-2.5 py-0.5 text-[11px] font-semibold text-background backdrop-blur">
              {p.category}
            </span>
          </div>
        </div>
      </a>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-xl font-semibold tracking-[-0.025em]">{p.title}</h3>
            <p className="mt-0.5 text-xs font-medium text-muted-foreground">{p.dates}</p>
          </div>
          <div className="flex gap-1 text-muted-foreground">
            {p.source && (
              <ExtLink href={p.source} className="grid size-8 place-items-center rounded-lg hover:bg-muted hover:text-foreground">
                <BrandIcon icon={siGithub} className="size-4" />
                <span className="sr-only">{p.title} source on GitHub</span>
              </ExtLink>
            )}
            <a href={p.href} {...target} className="grid size-8 place-items-center rounded-lg hover:bg-muted hover:text-foreground">
              {external ? <Globe className="size-4" aria-hidden /> : <ArrowUpRight className="size-4" aria-hidden />}
              <span className="sr-only">Open {p.title}</span>
            </a>
          </div>
        </div>
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{p.description}</p>
        <ul className="mt-4 mb-5 flex flex-wrap gap-1.5" aria-label="Technologies">
          {shownTech.map((t) => (
            <li key={t} className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
              {t}
            </li>
          ))}
          {p.tech.length > shownTech.length && (
            <li className="rounded-full border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              +{p.tech.length - shownTech.length} more
            </li>
          )}
        </ul>
        <div className="mt-auto flex items-center justify-end gap-3 border-t pt-4">
          {p.extension ? (
            <span className="flex w-full flex-wrap items-center justify-between gap-2 whitespace-nowrap">
              {/* store.js swaps this to the Chrome Web Store link once STORE_URL is set. */}
              <a
                href="/page-destroyer/page-destroyer.zip"
                download="page-destroyer.zip"
                data-chrome-link
                className="inline-flex items-center gap-1 text-sm font-medium hover:text-brand"
              >
                <Download className="size-3.5" aria-hidden />
                <span data-chrome-label>Download for Chrome</span>
              </a>
              <SmashButton />
            </span>
          ) : (
            <a href={p.href} {...target} className="inline-flex items-center gap-1.5 text-sm font-medium hover:text-brand">
              Visit
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

function ProjectsSection() {
  return (
    <section id="projects" className="bg-muted/40 py-24">
      <div className="mx-auto max-w-6xl px-5">
        <SectionHeading title="Projects" subtitle="Products I designed, built and run myself" />
        <ul className="flex flex-wrap justify-center gap-6">
          {PROJECTS.map((p) => (
            <li key={p.title} className="reveal w-full md:w-[calc(50%-12px)] lg:w-[calc((100%-48px)/3)]">
              <ProjectCard p={p} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Contact() {
  return (
    <footer id="contact" className="relative overflow-hidden border-t bg-surface pt-24 pb-32 md:pb-16">
      <div
        aria-hidden
        className="absolute inset-0 [background-image:radial-gradient(var(--border)_1px,transparent_1.2px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_60%_70%_at_50%_0%,black,transparent)]"
      />
      <div aria-hidden className="absolute -top-40 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-brand/15 blur-3xl" />
      <div className="reveal relative mx-auto max-w-2xl px-5 text-center">
        <h2 className="font-display text-4xl font-bold tracking-[-0.035em] sm:text-5xl">Let&apos;s build something</h2>
        <p className="mt-4 text-lg text-muted-foreground text-balance">
          For consulting, a collaboration or a role you think I&apos;d fit, email is fastest. LinkedIn works too.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <a
            href={`mailto:${PROFILE.email}`}
            className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-foreground px-7 py-3 font-medium text-background shadow-medium transition-transform hover:-translate-y-0.5"
          >
            <Mail className="size-4" aria-hidden />
            {PROFILE.email}
          </a>
          <ExtLink
            href={PROFILE.linkedin}
            className="inline-flex items-center justify-center gap-2 rounded-[10px] border bg-background px-7 py-3 font-medium transition-colors hover:bg-muted"
          >
            <LinkedInIcon className="size-4" />
            Message on LinkedIn
          </ExtLink>
        </div>
        <p className="mt-16 text-sm text-muted-foreground">
          © {new Date().getFullYear()} {PROFILE.name} · Built in Bengaluru
        </p>
      </div>
    </footer>
  );
}

export default function Page() {
  return (
    <>
      <main>
        <Hero />
        <ExperienceSection />
        <SkillsSection />
        <ProjectsSection />
      </main>
      <Contact />
    </>
  );
}
