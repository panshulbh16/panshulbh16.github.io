/* eslint-disable @next/next/no-img-element */
import { BrandIcon, LinkedInIcon, OracleMark } from "@/components/brand-icon";
import { CopyEmail } from "@/components/copy-email";
import { Hero } from "@/components/hero";
import { Checklist, ScrollWords } from "@/components/scroll-reveal";
import { SmashButton } from "@/components/smash-button";
import {
  ABOUT,
  EDUCATION,
  EXPERIENCE,
  MARQUEE,
  PROFILE,
  PROJECTS,
  SKILL_GROUPS,
  type Experience,
  type Project,
  type Skill,
  type SkillGroup,
} from "@/data/resume";
import { ArrowUpRight, Cloud, Code2, Download, GraduationCap, Layers, MapPin, Wrench } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { siGithub } from "simple-icons";

function ExtLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  const external = href.startsWith("http");
  return (
    <a href={href} className={className} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {children}
    </a>
  );
}

function Section({ id, title, children }: { id: string; title?: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-12 py-24 sm:py-32">
      <div className="mx-auto max-w-content px-5 sm:px-8">
        <p className="reveal font-mono text-[13px] text-accent">~/{id}</p>
        {title && (
          <h2 className="reveal mt-3 text-[clamp(2.2rem,6vw,3.5rem)] leading-[1.05] font-semibold tracking-[-0.04em] text-ink">
            {title}
          </h2>
        )}
        {children}
      </div>
    </section>
  );
}

// Photo beside the text when PROFILE.avatarUrl is set; until then the text stands alone (no monogram box).
function About() {
  const words = (
    <ScrollWords
      paragraphs={ABOUT}
      className="max-w-3xl text-[22px] leading-[1.45] font-semibold tracking-[-0.02em] sm:text-[28px]"
    />
  );
  return (
    <Section id="about">
      {PROFILE.avatarUrl ? (
        <div className="mt-8 grid gap-10 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-16">
          <figure className="reveal relative w-full max-w-[260px] self-start overflow-hidden rounded-[28px] bg-panel">
            <img
              src={PROFILE.avatarUrl}
              alt={`Portrait of ${PROFILE.name}`}
              width={520}
              height={520}
              loading="lazy"
              className="aspect-square w-full object-cover object-[50%_30%]"
            />
            <figcaption className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-md">
              <MapPin className="size-3 text-accent" aria-hidden />
              {PROFILE.location}
            </figcaption>
          </figure>
          {words}
        </div>
      ) : (
        <div className="mt-8">{words}</div>
      )}
    </Section>
  );
}

function BrowserShot({ p }: { p: Project }) {
  const external = p.href.startsWith("http");
  return (
    <ExtLink href={p.href} className="group/shot block overflow-hidden rounded-xl border border-line bg-canvas">
      <span aria-hidden className="flex items-center gap-1.5 border-b border-line px-3 py-2">
        <span className="size-2 rounded-full bg-[#ff5f57]" />
        <span className="size-2 rounded-full bg-[#febc2e]" />
        <span className="size-2 rounded-full bg-[#28c840]" />
        <span className="ml-2 truncate font-mono text-[11px] text-faint">
          {external ? new URL(p.href).hostname.replace(/^www\./, "") : "any page you're stuck on"}
        </span>
      </span>
      <span className="block aspect-[16/10] overflow-hidden">
        <img
          src={p.image}
          alt={p.imageAlt}
          width={800}
          height={500}
          loading="lazy"
          decoding="async"
          className="size-full object-cover object-top transition-transform duration-700 group-hover/shot:scale-[1.03]"
        />
      </span>
    </ExtLink>
  );
}

const pillLink =
  "inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-ink/40";

function WorkCard({ p }: { p: Project }) {
  return (
    <article className="reveal rounded-[28px] border border-line bg-panel p-6 sm:p-10">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-start">
        <div>
          <p className="font-mono text-[13px] tracking-wider text-faint">
            {p.category} · {p.dates}
          </p>
          <p className="text-gradient mt-6 text-[clamp(3.2rem,9vw,4.75rem)] leading-none font-semibold tracking-[-0.05em]">
            {p.stat.value}
          </p>
          <p className="mt-3 text-sm text-faint">{p.stat.label}</p>
          <h3 className="mt-8 text-[26px] font-semibold tracking-[-0.03em] text-ink">{p.title}</h3>
          <p className="mt-3 text-[17px] leading-relaxed">{p.description}</p>
          <div className="mt-8">
            <Checklist steps={p.steps} />
          </div>
        </div>
        <BrowserShot p={p} />
      </div>
      <footer className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
        <ul className="flex flex-wrap gap-1.5" aria-label="Technologies">
          {p.tech.map((t) => (
            <li key={t} className="rounded-full bg-ink/[0.07] px-3 py-1 font-mono text-xs text-ink/80">
              {t}
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-center gap-2">
          {p.source && (
            <ExtLink href={p.source} className={pillLink}>
              <BrandIcon icon={siGithub} className="size-4" />
              Source
              <span className="sr-only"> for {p.title} on GitHub</span>
            </ExtLink>
          )}
          {p.extension ? (
            <>
              {/* store.js swaps this to the Chrome Web Store link once STORE_URL is set. */}
              <a href="/page-destroyer/page-destroyer.zip" download="page-destroyer.zip" data-chrome-link className={pillLink}>
                <Download className="size-4" aria-hidden />
                <span data-chrome-label>Download for Chrome</span>
              </a>
              <SmashButton />
            </>
          ) : (
            <ExtLink
              href={p.href}
              className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-medium text-on-accent transition-opacity hover:opacity-90"
            >
              Open {p.title}
              <ArrowUpRight className="size-4" aria-hidden />
            </ExtLink>
          )}
        </div>
      </footer>
    </article>
  );
}

function Work() {
  return (
    <Section id="work" title="Selected work">
      <p className="reveal mt-4 max-w-2xl text-lg">Products I designed, built and run myself, end to end.</p>
      <div className="mt-14 space-y-6">
        {PROJECTS.map((p) => (
          <WorkCard key={p.title} p={p} />
        ))}
      </div>
    </Section>
  );
}

function ExperienceCard({ item }: { item: Experience }) {
  return (
    <article className="rounded-[24px] border border-line bg-panel p-6 sm:p-8">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h3 className="text-[28px] font-semibold tracking-[-0.03em] text-ink">
          {item.href ? (
            <ExtLink href={item.href} className="hover:text-accent">
              {item.org}
            </ExtLink>
          ) : (
            item.org
          )}
        </h3>
        <p className="font-mono text-[13px] text-faint">{item.dates}</p>
      </header>
      {(item.unit || item.place) && (
        <p className="mt-1 text-[15px]">{[item.unit, item.place].filter(Boolean).join(" · ")}</p>
      )}
      {item.roles.map((role) => (
        <div key={role.title} className="mt-7">
          <h4 className="text-lg font-semibold tracking-[-0.02em] text-ink">{role.title}</h4>
          <ul className="mt-4 space-y-4 text-[16px] leading-relaxed">
            {role.bullets.map((b) => (
              <li key={b.lead} className="relative pl-6 before:absolute before:top-[0.65em] before:left-0 before:size-1.5 before:rounded-full before:bg-accent">
                <span className="font-medium text-ink">{b.lead}</span>
                {b.rest}
              </li>
            ))}
          </ul>
        </div>
      ))}
      <ul className="mt-7 flex flex-wrap gap-1.5 border-t border-line pt-6" aria-label="Technologies">
        {item.tech.map((t) => (
          <li key={t} className="rounded-full border border-line px-3 py-1 text-xs text-ink/80">
            {t}
          </li>
        ))}
      </ul>
    </article>
  );
}

function ExperienceSection() {
  return (
    <Section id="experience" title="Experience">
      <p className="reveal mt-4 text-lg">Building on Oracle Cloud since 2021.</p>
      <ol className="relative mt-14 space-y-8">
        {/* Timeline rail: light into deep blue, like the headline gradient. */}
        <span
          aria-hidden
          className="absolute top-3 bottom-3 left-[7px] w-px bg-gradient-to-b from-[rgb(var(--g1))] via-[rgb(var(--g3))] to-transparent"
        />
        {EXPERIENCE.map((item, i) => (
          <li key={item.org} className="reveal relative pl-9 sm:pl-12">
            <span
              aria-hidden
              className={`absolute top-8 left-0 size-[15px] rounded-full border-2 bg-canvas ${i === 0 ? "border-accent" : "border-[rgb(var(--g3))]"}`}
            />
            <ExperienceCard item={item} />
          </li>
        ))}
      </ol>
    </Section>
  );
}

function SkillIcon({ s, className }: { s: Skill; className: string }) {
  if (s.icon) return <BrandIcon icon={s.icon} className={className} />;
  if (s.oracle) return <OracleMark className={className} />;
  return null;
}

function Marquee({ items, reverse }: { items: Skill[]; reverse?: boolean }) {
  return (
    <div className="marquee-mask overflow-hidden">
      <ul
        className={`marquee flex w-max gap-3 py-1.5 ${reverse ? "marquee-reverse" : ""}`}
        style={{ "--dur": `${items.length * 4.5}s` } as CSSProperties}
      >
        {[...items, ...items].map((s, i) => (
          <li
            key={i}
            aria-hidden={i >= items.length}
            className="flex items-center gap-2.5 rounded-2xl border border-line bg-panel px-5 py-3 text-[15px] font-medium whitespace-nowrap text-ink"
          >
            <SkillIcon s={s} className="size-5" />
            {s.name}
          </li>
        ))}
      </ul>
    </div>
  );
}

const GROUP_ICONS: Record<SkillGroup["icon"], ReactNode> = {
  code: <Code2 className="size-5" aria-hidden />,
  layers: <Layers className="size-5" aria-hidden />,
  cloud: <Cloud className="size-5" aria-hidden />,
  wrench: <Wrench className="size-5" aria-hidden />,
  oracle: <OracleMark className="size-6" />,
};

function Skills() {
  return (
    <Section id="skills" title="Skills and tools">
      <div aria-hidden className="reveal -mx-5 mt-12 space-y-3 sm:-mx-8">
        <Marquee items={MARQUEE[0]} />
        <Marquee items={MARQUEE[1]} reverse />
      </div>
      <div className="mt-12 grid gap-4 md:grid-cols-2">
        {SKILL_GROUPS.map((g, i) => (
          <article
            key={g.title}
            className={`reveal rounded-[24px] border border-line bg-panel p-6 sm:p-7 ${i === 0 ? "md:col-span-2" : ""}`}
          >
            <span className="grid size-11 place-items-center rounded-xl bg-accent/15 text-accent">{GROUP_ICONS[g.icon]}</span>
            <h3 className="mt-5 text-xl font-semibold tracking-[-0.02em] text-ink">{g.title}</h3>
            <ul className="mt-4 flex flex-wrap gap-2">
              {g.skills.map((s) => (
                <li key={s.name} className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-[13px] text-ink">
                  <SkillIcon s={s} className="size-3.5" />
                  {s.name}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      <article className="reveal mt-4 flex items-center gap-5 rounded-[24px] border border-line bg-panel p-6 sm:p-7">
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-accent/15 text-accent">
          <GraduationCap className="size-6" aria-hidden />
        </span>
        <div>
          <h3 className="text-lg font-semibold tracking-[-0.02em] text-ink">
            <ExtLink href={EDUCATION.href} className="hover:text-accent">
              {EDUCATION.name}
            </ExtLink>
          </h3>
          <p className="mt-0.5 text-sm">Education · {EDUCATION.place}</p>
        </div>
      </article>
    </Section>
  );
}

function Contact() {
  return (
    <Section id="contact" title="Get in touch">
      <p className="reveal mt-6 max-w-2xl text-lg leading-relaxed">
        For consulting, a collaboration or just to talk about something I built, email is the fastest way to reach me.
      </p>
      <a
        href={`mailto:${PROFILE.email}`}
        className="reveal text-gradient mt-8 inline-block text-[clamp(1.35rem,5vw,2.75rem)] font-semibold tracking-[-0.035em] break-all hover:opacity-85"
      >
        {PROFILE.email}
      </a>
      <div className="reveal mt-8 flex flex-wrap gap-3">
        <CopyEmail email={PROFILE.email} className={pillLink} />
        <ExtLink href={PROFILE.linkedin} className={pillLink}>
          <LinkedInIcon className="size-4" />
          LinkedIn
          <ArrowUpRight className="size-4" aria-hidden />
        </ExtLink>
        <ExtLink href={PROFILE.github} className={pillLink}>
          <BrandIcon icon={siGithub} className="size-4" />
          GitHub
          <ArrowUpRight className="size-4" aria-hidden />
        </ExtLink>
      </div>
    </Section>
  );
}

export default function Page() {
  return (
    <>
      <main>
        <Hero />
        <About />
        <Work />
        <ExperienceSection />
        <Skills />
        <Contact />
      </main>
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-content flex-wrap items-center justify-between gap-3 px-5 py-8 text-[13px] sm:px-8">
          <p>
            © {new Date().getFullYear()} {PROFILE.name} · Built in Bengaluru
          </p>
          <a href="#top" className="hover:text-ink">
            Back to top
          </a>
        </div>
      </footer>
    </>
  );
}
