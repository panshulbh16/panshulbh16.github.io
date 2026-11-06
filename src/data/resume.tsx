// Everything on the page comes from this file. Edit here, not in the components.
// Rule for this file: every fact must be true and checkable. No invented numbers.
import {
  siClaude,
  siCloudflare,
  siCloudflareworkers,
  siDrizzle,
  siExpo,
  siGit,
  siGithubactions,
  siHono,
  siJavascript,
  siNextdotjs,
  siNodedotjs,
  siPostgresql,
  siPython,
  siRazorpay,
  siReact,
  siResend,
  siSqlite,
  siTailwindcss,
  siTypescript,
  siVitest,
  type SimpleIcon,
} from "simple-icons";

export const PROFILE = {
  name: "Panshul Bharadwaj",
  initials: "PB",
  handle: "panshul",
  url: "https://panshulbh16.github.io",
  // Drop a square photo at public/me.jpg and set this to "/me.jpg". Until then About is text only.
  avatarUrl: "",
  role: "Technology Consultant & Product Engineer",
  description:
    "Technology consultant at Deloitte, building on Oracle Cloud. Outside work I design, build and run my own software products.",
  location: "Bengaluru, India",
  email: "bharadwajpanshul@gmail.com",
  github: "https://github.com/panshulbh16",
  linkedin: "https://www.linkedin.com/in/panshul-bharadwaj",
};

// Badge above the name. Deliberately not an availability signal.
export const HERO_BADGE = { status: "4 products live", tags: "Oracle Cloud · Full-stack · AI" };

// Output of `describe engineer panshul` in the hero terminal. [key, value, accent?]
export const TERMINAL: [string, string, boolean?][] = [
  ["Name", "Panshul Bharadwaj"],
  ["Role", "Technology Consultant, Deloitte USI"],
  ["Practice", "Oracle CX · Redwood · Sales & Service Cloud"],
  ["Building on", "Oracle Cloud since 2021"],
  ["After hours", "Next.js · Cloudflare Workers · Claude"],
  ["Shipped", "Duely · Roamly · Tailor · Page Destroyer"],
  ["Location", "Bengaluru, India"],
  ["Status", "Shipping", true],
];

// ~/about, revealed word by word on scroll. The first paragraph stays fully lit.
export const ABOUT = [
  "I'm a technology consultant in Deloitte's Oracle CX practice, where I design and build sales and service systems on Oracle Cloud Redwood for companies in the US and Canada.",
  "Before Deloitte I spent three and a half years at SoftClouds, building Oracle Sales and Service Cloud implementations and custom Visual Builder extensions for global clients.",
  "After hours I take my own ideas from first sketch to production: three web products and a Chrome extension, each designed, built, deployed and run by me.",
];

export type Link = { label: string; href: string };

export type Experience = {
  org: string;
  href?: string;
  unit?: string;
  dates: string;
  place?: string;
  roles: { title: string; bullets: { lead: string; rest: string }[] }[];
  tech: string[];
};

export const EXPERIENCE: Experience[] = [
  {
    org: "Deloitte USI",
    href: "https://www.deloitte.com/",
    unit: "Oracle CX practice",
    dates: "Aug 2025 – Present",
    place: "India",
    roles: [
      {
        title: "Technology Consultant",
        bullets: [
          {
            lead: "Design and build enterprise systems on Oracle Cloud Redwood",
            rest: " (Sales & Service) for companies in the US and Canada.",
          },
          {
            lead: "Build custom application extensions and configuration",
            rest: " fitted to each client's sales and service processes.",
          },
          {
            lead: "Turn business and compliance requirements into system designs",
            rest: " that stay maintainable, working directly with client stakeholders.",
          },
        ],
      },
    ],
    tech: ["Oracle Fusion Cloud", "Redwood", "Sales Cloud", "Service Cloud", "VBCS", "System design"],
  },
  {
    org: "SoftClouds",
    href: "https://www.softclouds.com/",
    dates: "Oct 2021 – May 2025",
    place: "India",
    roles: [
      {
        title: "Software Engineer",
        bullets: [
          {
            lead: "Built and extended Oracle Sales Cloud and Service Cloud implementations",
            rest: " for global clients.",
          },
          {
            lead: "Developed custom application extensions and UIs on Visual Builder (VBCS)",
            rest: ", groundwork for the Redwood work that followed.",
          },
        ],
      },
    ],
    tech: ["Oracle Sales Cloud", "Oracle Service Cloud", "VBCS", "JavaScript"],
  },
];

export const EDUCATION = {
  name: "MS Ramaiah University of Applied Sciences",
  href: "https://www.msruas.ac.in/",
  place: "Bengaluru",
};

export type Skill = { name: string; icon?: SimpleIcon; oracle?: true };
export type SkillGroup = { title: string; icon: "code" | "layers" | "cloud" | "oracle" | "wrench"; skills: Skill[] };

const S = {
  ts: { name: "TypeScript", icon: siTypescript },
  js: { name: "JavaScript", icon: siJavascript },
  py: { name: "Python", icon: siPython },
  react: { name: "React", icon: siReact },
  next: { name: "Next.js", icon: siNextdotjs },
  rn: { name: "React Native", icon: siReact },
  expo: { name: "Expo", icon: siExpo },
  node: { name: "Node.js", icon: siNodedotjs },
  hono: { name: "Hono", icon: siHono },
  tw: { name: "Tailwind CSS", icon: siTailwindcss },
  cfw: { name: "Cloudflare Workers", icon: siCloudflareworkers },
  d1: { name: "Cloudflare D1", icon: siCloudflare },
  sqlite: { name: "SQLite", icon: siSqlite },
  pg: { name: "PostgreSQL", icon: siPostgresql },
  drizzle: { name: "Drizzle", icon: siDrizzle },
  claude: { name: "Claude API", icon: siClaude },
  git: { name: "Git", icon: siGit },
  gha: { name: "GitHub Actions", icon: siGithubactions },
  vitest: { name: "Vitest", icon: siVitest },
  razorpay: { name: "Razorpay", icon: siRazorpay },
  resend: { name: "Resend", icon: siResend },
} satisfies Record<string, Skill>;

export const SKILL_GROUPS: SkillGroup[] = [
  {
    title: "Oracle Cloud",
    icon: "oracle",
    skills: [
      { name: "Oracle Fusion Cloud", oracle: true },
      { name: "Sales & Service Cloud", oracle: true },
      { name: "Redwood", oracle: true },
      { name: "Visual Builder (VBCS)", oracle: true },
    ],
  },
  { title: "Languages", icon: "code", skills: [S.ts, S.js, S.py] },
  { title: "Frameworks", icon: "layers", skills: [S.react, S.next, S.rn, S.expo, S.node, S.hono, S.tw] },
  { title: "Cloud & Data", icon: "cloud", skills: [S.cfw, S.d1, S.sqlite, S.pg, S.drizzle, S.claude] },
  { title: "Tools", icon: "wrench", skills: [S.git, S.gha, S.vitest, S.razorpay, S.resend] },
];

// The two scrolling rows above the skill cards.
export const MARQUEE: Skill[][] = [
  [S.ts, S.react, S.next, S.cfw, S.claude, S.hono, S.d1, S.tw, S.expo, S.node],
  [S.sqlite, S.pg, S.drizzle, S.razorpay, S.resend, S.gha, S.vitest, S.git, S.py, S.js],
];

export type Project = {
  title: string;
  href: string;
  source?: string;
  category: string;
  dates: string;
  // The big gradient figure. Only facts the product itself states.
  stat: { value: string; label: string };
  description: string;
  // How it works, ticked off as the card scrolls into view.
  steps: string[];
  tech: string[];
  image: string;
  imageAlt: string;
  // Page Destroyer only: install link + smash button instead of "Visit".
  extension?: true;
};

export const PROJECTS: Project[] = [
  {
    title: "Duely",
    href: "https://heyduely.com/",
    category: "Personal finance",
    dates: "Oct 2026 · web, iOS, Android",
    stat: { value: "100+", label: "apps ready to pick, or forward a receipt" },
    description:
      "Every subscription in one place, with what you pay a month and a year, and a reminder before each renewal or free trial turns into a charge.",
    steps: ["Forward a receipt or connect Gmail", "Claude drafts the subscription", "You confirm it", "Email before it renews"],
    tech: ["Cloudflare Workers", "Hono", "D1", "React", "Expo", "Claude"],
    image: "/assets/img/duely-800.webp",
    imageAlt: "Duely dashboard: monthly subscription total with upcoming renewals and spend by category",
  },
  {
    title: "Roamly",
    href: "https://heyroamly.com/",
    category: "Travel · AI",
    dates: "Sep 2026",
    stat: { value: "1 min", label: "from destination to a day-by-day plan" },
    description:
      "An AI trip planner for road trips with friends: it paces the route, daily drive times and stops, then your group joins in. Or a day-by-day plan for any city.",
    steps: ["Destination, dates and pace", "Route and stops planned", "Publish the trip", "Friends ask to join"],
    tech: ["Next.js", "Cloudflare Workers", "D1", "Drizzle", "Claude", "Razorpay"],
    image: "/assets/img/roamly-800.webp",
    imageAlt: "Roamly trip planner: Where to next, with a Dolomites photo above the trip form",
  },
  {
    title: "Tailor",
    href: "https://tailor-production-6d17.up.railway.app/",
    source: "https://github.com/panshulbh16/tailor",
    category: "Careers · AI",
    dates: "Sep 2026",
    stat: { value: "0–100", label: "honest fit score, streamed in seconds" },
    description:
      "Paste a résumé and a job description. Tailor returns a fit score, the gaps, and a résumé rewritten for that role using only what's on it, streamed in as it writes.",
    steps: ["Résumé and job description", "Fit score and verdict", "Gaps called out", "Rewrite streams in"],
    tech: ["Next.js", "Claude", "SQLite", "Razorpay"],
    image: "/assets/img/tailor-800.webp",
    imageAlt: "Tailor: résumé and job-description boxes beside a results panel",
  },
  {
    title: "Page Destroyer",
    href: "/page-destroyer/",
    category: "Chrome extension",
    dates: "Oct 2026",
    stat: { value: "0", label: "bytes collected. Nothing leaves your browser" },
    description:
      "Stuck on a slow portal or a ticket that won't move? Click the icon and smash the page. Repair it with one key when you're done.",
    steps: ["Hammer", "Gun", "Chainsaw", "Fire"],
    tech: ["Chrome extension", "Canvas", "Web Audio"],
    image: "/assets/img/page-destroyer-800.webp",
    imageAlt: "A web page after a Page Destroyer session: glass cracks, a chainsaw cut, bullet holes and a scorch mark",
    extension: true,
  },
];

export const NAV = [
  { id: "about", label: "About" },
  { id: "work", label: "Work" },
  { id: "experience", label: "Experience" },
  { id: "skills", label: "Skills" },
  { id: "contact", label: "Contact" },
] as const;
