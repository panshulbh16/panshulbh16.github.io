// Everything on the page comes from this file. Edit here, not in the components.
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
  url: "https://panshulbh16.github.io",
  // Drop a square photo at public/me.jpg and set this to "/me.jpg". Until then the monogram shows.
  avatarUrl: "",
  tagline: "Technology Consultant at Deloitte · Oracle Cloud by day, my own products by night",
  description:
    "Technology consultant at Deloitte, building on Oracle Cloud. Outside work I design, build and run my own software products.",
  location: "Bengaluru, India",
  email: "bharadwajpanshul@gmail.com",
  github: "https://github.com/panshulbh16",
  linkedin: "https://www.linkedin.com/in/panshul-bharadwaj",
};

export type Link = { label: string; href: string };

export type Experience = {
  org: string;
  href?: string;
  // Monogram tile instead of a logo file: a letter on the org's own colour.
  mark: { letter: string; bg: string; fg: string; dot?: string };
  badges: { label: string; tone?: "brand" | "plain" }[];
  meta: string;
  place?: string;
  summary?: string;
  roles: { title: string; badge?: string; dates: string; bullets: string[] }[];
  links?: Link[];
  tech: string[];
};

export const EXPERIENCE: Experience[] = [
  {
    org: "Deloitte USI",
    href: "https://www.deloitte.com/",
    mark: { letter: "D", bg: "#000000", fg: "#ffffff", dot: "#86BC25" },
    badges: [{ label: "Oracle CX practice", tone: "brand" }, { label: "Current" }],
    meta: "Aug 2025 – Present",
    place: "India",
    roles: [
      {
        title: "Technology Consultant",
        badge: "Latest",
        dates: "Aug 2025 – Present",
        bullets: [
          "Design and build enterprise systems on Oracle Cloud Redwood (Sales & Service) for companies in the US and Canada.",
          "Build custom application extensions and configuration fitted to each client's sales and service processes.",
          "Work with client stakeholders to turn business and compliance requirements into system designs that stay maintainable.",
        ],
      },
    ],
    tech: ["Oracle Fusion Cloud", "Redwood", "Sales Cloud", "Service Cloud", "VBCS", "System design"],
  },
  {
    org: "SoftClouds",
    href: "https://www.softclouds.com/",
    mark: { letter: "S", bg: "#1D4ED8", fg: "#ffffff" },
    badges: [],
    meta: "Oct 2021 – May 2025",
    place: "India",
    roles: [
      {
        title: "Software Engineer",
        dates: "Oct 2021 – May 2025",
        bullets: [
          "Built and extended Oracle Sales Cloud and Oracle Service Cloud implementations for international clients.",
          "Developed custom application extensions and UIs on Oracle Visual Builder (VBCS), groundwork for the Redwood work that followed.",
        ],
      },
    ],
    tech: ["Oracle Sales Cloud", "Oracle Service Cloud", "VBCS", "JavaScript"],
  },
  {
    org: "MS Ramaiah University of Applied Sciences",
    href: "https://www.msruas.ac.in/",
    mark: { letter: "R", bg: "#7F1D1D", fg: "#ffffff" },
    badges: [{ label: "Education" }],
    meta: "University",
    place: "Bengaluru",
    roles: [],
    tech: [],
  },
];

export type Skill = { name: string; group: SkillGroup; icon?: SimpleIcon; oracle?: true };
export const SKILL_GROUPS = ["Languages", "Frameworks", "Cloud & Data", "Oracle", "Tools"] as const;
export type SkillGroup = (typeof SKILL_GROUPS)[number];

export const SKILLS: Skill[] = [
  { name: "TypeScript", group: "Languages", icon: siTypescript },
  { name: "JavaScript", group: "Languages", icon: siJavascript },
  { name: "Python", group: "Languages", icon: siPython },
  { name: "React", group: "Frameworks", icon: siReact },
  { name: "Next.js", group: "Frameworks", icon: siNextdotjs },
  { name: "React Native", group: "Frameworks", icon: siReact },
  { name: "Expo", group: "Frameworks", icon: siExpo },
  { name: "Node.js", group: "Frameworks", icon: siNodedotjs },
  { name: "Hono", group: "Frameworks", icon: siHono },
  { name: "Tailwind CSS", group: "Frameworks", icon: siTailwindcss },
  { name: "Cloudflare Workers", group: "Cloud & Data", icon: siCloudflareworkers },
  { name: "Cloudflare D1", group: "Cloud & Data", icon: siCloudflare },
  { name: "SQLite", group: "Cloud & Data", icon: siSqlite },
  { name: "PostgreSQL", group: "Cloud & Data", icon: siPostgresql },
  { name: "Drizzle", group: "Cloud & Data", icon: siDrizzle },
  { name: "Claude API", group: "Cloud & Data", icon: siClaude },
  { name: "Oracle Fusion Cloud", group: "Oracle", oracle: true },
  { name: "Sales & Service Cloud", group: "Oracle", oracle: true },
  { name: "Redwood", group: "Oracle", oracle: true },
  { name: "Visual Builder (VBCS)", group: "Oracle", oracle: true },
  { name: "Git", group: "Tools", icon: siGit },
  { name: "GitHub Actions", group: "Tools", icon: siGithubactions },
  { name: "Vitest", group: "Tools", icon: siVitest },
  { name: "Razorpay", group: "Tools", icon: siRazorpay },
  { name: "Resend", group: "Tools", icon: siResend },
];

export type Project = {
  title: string;
  href: string;
  source?: string;
  category: string;
  dates: string;
  description: string;
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
    description:
      "Every subscription in one place, with what you pay a month and a year, and a reminder before each renewal or free trial turns into a charge. Subscriptions arrive as drafts from forwarded receipts, read-only Gmail or an App Store screenshot.",
    tech: ["Cloudflare Workers", "Hono", "D1", "React", "Expo", "Claude"],
    image: "/assets/img/duely-800.webp",
    imageAlt: "Duely dashboard: ₹7,911 a month across 10 active subscriptions, with upcoming renewals and spend by category",
  },
  {
    title: "Roamly",
    href: "https://heyroamly.com/",
    category: "Travel · AI",
    dates: "Sep 2026",
    description:
      "An AI trip planner that turns a destination, dates, budget and pace into a day-by-day itinerary, then lets you publish the trip and invite people along.",
    tech: ["Next.js", "Cloudflare Workers", "D1", "Drizzle", "Claude", "Razorpay"],
    image: "/assets/img/roamly-800.webp",
    imageAlt: "Roamly trip planner: Where to next, with a Dolomites photo above the trip form",
  },
  {
    title: "Opportunity Hunter",
    href: "https://opportunityhunter.xyz/",
    source: "https://github.com/panshulbh16/opportunity-hunter",
    category: "Careers · AI",
    dates: "Sep 2026",
    description:
      "A job-matching agent: describe the role you want and it keeps searching licensed listings, scores each one 0–100 with a reason, and learns from what you save, apply to and reject.",
    tech: ["Next.js", "SQLite", "Voyage embeddings", "Razorpay"],
    image: "/assets/img/opportunity-hunter-800.webp",
    imageAlt: "Opportunity Hunter landing page: Stop Searching. Start Getting Matched, above a 92% match card for a backend role",
  },
  {
    title: "Tailor",
    href: "https://tailor-production-6d17.up.railway.app/",
    source: "https://github.com/panshulbh16/tailor",
    category: "Careers · AI",
    dates: "Sep 2026",
    description:
      "Paste a résumé and a job description. Tailor returns an honest fit score, the gaps, and a résumé rewritten for that role using only what's on it, streamed in as it writes.",
    tech: ["Next.js", "Claude", "SQLite", "Razorpay"],
    image: "/assets/img/tailor-800.webp",
    imageAlt: "Tailor: Your résumé, matched to the job, with résumé and job-description boxes beside a results panel",
  },
  {
    title: "Page Destroyer",
    href: "/page-destroyer/",
    category: "Chrome extension",
    dates: "Oct 2026",
    description:
      "Stuck on a slow portal or a ticket that won't move? Click the icon and smash the page with a hammer, a gun, a chainsaw or fire. Nothing is saved and nothing leaves your browser.",
    tech: ["Chrome extension", "Canvas", "Web Audio"],
    image: "/assets/img/page-destroyer-800.webp",
    imageAlt: "A web page after a Page Destroyer session: glass cracks, a chainsaw cut, bullet holes and a scorch mark, with the weapon toolbar at the bottom",
    extension: true,
  },
];

export const NAV = [
  { id: "home", label: "Home" },
  { id: "experience", label: "Experience" },
  { id: "skills", label: "Skills" },
  { id: "projects", label: "Projects" },
  { id: "contact", label: "Contact" },
] as const;
