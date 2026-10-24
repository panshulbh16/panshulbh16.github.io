// Everything on the page comes from this file. Edit here, not in the components.
import { Icons } from "@/components/icons";
import { HomeIcon } from "lucide-react";
import { ReactLight } from "@/components/ui/svgs/reactLight";
import { NextjsIconDark } from "@/components/ui/svgs/nextjsIconDark";
import { Typescript } from "@/components/ui/svgs/typescript";
import { Nodejs } from "@/components/ui/svgs/nodejs";
import { Postgresql } from "@/components/ui/svgs/postgresql";

export const DATA = {
  name: "Panshul Bharadwaj",
  initials: "PB",
  url: "https://panshulbh16.github.io",
  location: "Bengaluru, India",
  description:
    "Technology consultant at Deloitte, building on Oracle Cloud. Outside work I design, build and run my own software products.",
  summary:
    "I've built on Oracle Cloud since 2021. I started as a software engineer at SoftClouds, implementing Oracle Sales and Service Cloud and Visual Builder apps, and I'm now a technology consultant in Deloitte's Oracle CX practice, designing Redwood (Sales & Service) systems for companies in the US and Canada.\n\nOn my own time I take products from idea to production, from the database schema to the copy on the buttons. Four are live: [Duely](https://heyduely.com/) for subscriptions, [Roamly](https://heyroamly.com/) for trips, [Tailor](https://tailor-production-6d17.up.railway.app/) for résumés and [Opportunity Hunter](https://opportunityhunter.xyz/) for jobs.\n\nI care most about the parts that never make the demo: a score you can explain, a daily quota the client can't bypass, a payment webhook that still grants access if the tab closes.",
  // Drop a square photo at public/me.jpg and set avatarUrl: "/me.jpg". Until then the initials show.
  avatarUrl: "",
  skills: [
    { name: "TypeScript", icon: Typescript },
    { name: "React", icon: ReactLight },
    { name: "Next.js", icon: NextjsIconDark },
    { name: "Node.js", icon: Nodejs },
    { name: "React Native" },
    { name: "Cloudflare Workers" },
    { name: "SQLite / D1" },
    { name: "PostgreSQL", icon: Postgresql },
    { name: "Claude API" },
    { name: "Oracle Sales & Service Cloud" },
    { name: "Oracle Redwood" },
    { name: "Oracle VBCS" },
  ],
  navbar: [{ href: "/", icon: HomeIcon, label: "Home" }],
  contact: {
    email: "bharadwajpanshul@gmail.com",
    social: {
      GitHub: {
        name: "GitHub",
        url: "https://github.com/panshulbh16",
        icon: Icons.github,
        navbar: true,
      },
      LinkedIn: {
        name: "LinkedIn",
        url: "https://www.linkedin.com/in/panshul-bharadwaj",
        icon: Icons.linkedin,
        navbar: true,
      },
      Email: {
        name: "Email",
        url: "mailto:bharadwajpanshul@gmail.com",
        icon: Icons.email,
        navbar: true,
      },
    },
  },

  work: [
    {
      company: "Deloitte USI",
      href: "https://www.deloitte.com/",
      title: "Technology Consultant · Oracle CX",
      logoUrl: "",
      start: "Aug 2025",
      end: "Present",
      description:
        "Design and build enterprise systems on Oracle Cloud Redwood (Sales & Service) for companies in the US and Canada: custom application extensions and configuration fitted to each client's sales and service processes, and system designs that turn business and compliance requirements into something maintainable.",
    },
    {
      company: "SoftClouds",
      href: "https://www.softclouds.com/",
      title: "Software Engineer",
      logoUrl: "",
      start: "Oct 2021",
      end: "May 2025",
      description:
        "Built and extended Oracle Sales Cloud and Oracle Service Cloud implementations for international clients, with custom extensions and UIs on Oracle Visual Builder (VBCS).",
    },
  ],
  education: [
    {
      school: "MS Ramaiah University of Applied Sciences",
      href: "https://www.msruas.ac.in/",
      degree: "",
      logoUrl: "",
      start: "",
      end: "",
    },
  ],
  // Icons are names (not components) so these can cross into the client-side card.
  projects: [
    {
      title: "Duely",
      href: "https://heyduely.com/",
      dates: "Oct 2026 – now · web, iOS, Android",
      description:
        "Every subscription in one place, with what you pay a month and a year, and a reminder before each renewal or free trial turns into a charge. Subscriptions arrive as drafts from forwarded receipts, read-only Gmail or an App Store screenshot.",
      technologies: ["Cloudflare Workers", "Hono", "D1", "React", "Expo", "Claude"],
      links: [{ type: "heyduely.com", href: "https://heyduely.com/", icon: "globe" }],
      image: "/assets/img/duely-800.webp",
      imageAlt: "Duely dashboard: ₹7,911 a month across 10 active subscriptions, with upcoming renewals and spend by category",
    },
    {
      title: "Roamly",
      href: "https://heyroamly.com/",
      dates: "Sep 2026 – now",
      description:
        "An AI trip planner that turns a destination, dates, budget and pace into a day-by-day itinerary, then lets you publish the trip and invite people along. AI spend sits behind an atomic per-user and monthly budget that fails closed.",
      technologies: ["Next.js", "Cloudflare Workers", "D1", "Drizzle", "Claude", "Razorpay"],
      links: [{ type: "heyroamly.com", href: "https://heyroamly.com/", icon: "globe" }],
      image: "/assets/img/roamly-800.webp",
      imageAlt: "Roamly trip planner: Where to next, with a Dolomites photo above the trip form",
    },
    {
      title: "Opportunity Hunter",
      href: "https://opportunityhunter.xyz/",
      dates: "Sep 2026 – now",
      description:
        "A job-matching agent: describe the role you want and it keeps searching licensed listings, scores each one 0–100 against your profile with a reason, and learns from what you save, apply to and reject.",
      technologies: ["Next.js", "SQLite", "Voyage embeddings", "Razorpay"],
      links: [
        { type: "Website", href: "https://opportunityhunter.xyz/", icon: "globe" },
        { type: "Source", href: "https://github.com/panshulbh16/opportunity-hunter", icon: "github" },
      ],
      image: "/assets/img/opportunity-hunter-800.webp",
      imageAlt: "Opportunity Hunter landing page: Stop Searching. Start Getting Matched, above a 92% match card for a backend role",
    },
    {
      title: "Tailor",
      href: "https://tailor-production-6d17.up.railway.app/",
      dates: "Sep 2026",
      description:
        "Paste a résumé and a job description. Tailor returns an honest fit score, the gaps, and a résumé rewritten for that role using only what's on it, streamed in as it writes.",
      technologies: ["Next.js", "Claude", "SQLite", "Razorpay"],
      links: [
        { type: "Website", href: "https://tailor-production-6d17.up.railway.app/", icon: "globe" },
        { type: "Source", href: "https://github.com/panshulbh16/tailor", icon: "github" },
      ],
      image: "/assets/img/tailor-800.webp",
      imageAlt: "Tailor: Your résumé, matched to the job, with résumé and job-description boxes beside a results panel",
    },
    {
      title: "Page Destroyer",
      href: "/page-destroyer/",
      dates: "Oct 2026 · Chrome extension",
      description:
        "Stuck on a slow portal or a ticket that won't move? Click the icon and smash the page with a hammer, a gun, a chainsaw or fire. Nothing is saved and nothing leaves your browser.",
      technologies: ["Chrome extension", "Canvas", "Web Audio"],
      // chrome: page-destroyer/store.js swaps this to the Web Store link once STORE_URL is set.
      // destroy: store.js loads the destroyer onto this page.
      links: [
        { type: "Download for Chrome", href: "/page-destroyer/page-destroyer.zip", icon: "download", chrome: true },
        { type: "Smash this page", href: "", icon: "hammer", destroy: true },
      ],
      image: "/assets/img/page-destroyer-800.webp",
      imageAlt: "This portfolio after a Page Destroyer session: glass cracks, a chainsaw cut, bullet holes and a scorch mark, with the weapon toolbar at the bottom",
    },
  ],
} as const;
