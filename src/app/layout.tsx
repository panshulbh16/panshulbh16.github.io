import { BackToTop } from "@/components/back-to-top";
import { SiteHeader } from "@/components/site-header";
import { ThemeProvider } from "@/components/theme-provider";
import { EXPERIENCE, PROFILE, PROJECTS, SKILLS } from "@/data/resume";
import type { Metadata, Viewport } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const interTight = Inter_Tight({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-inter-tight" });

const title = `${PROFILE.name} · Technology consultant and product engineer`;
const ogImage = { url: "/og.png", width: 1200, height: 630, alt: `${PROFILE.name}, ${PROFILE.location}` };

export const metadata: Metadata = {
  metadataBase: new URL(PROFILE.url),
  title,
  description: PROFILE.description,
  authors: [{ name: PROFILE.name, url: PROFILE.url }],
  alternates: { canonical: "/" },
  icons: { icon: "/assets/favicon.svg" },
  openGraph: {
    title,
    description: PROFILE.description,
    url: "/",
    siteName: PROFILE.name,
    locale: "en_IN",
    type: "profile",
    images: [ogImage],
  },
  twitter: { card: "summary_large_image", title, description: PROFILE.description, images: [ogImage] },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f4ee" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1115" },
  ],
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  url: `${PROFILE.url}/`,
  mainEntity: {
    "@type": "Person",
    name: PROFILE.name,
    url: `${PROFILE.url}/`,
    email: `mailto:${PROFILE.email}`,
    description: PROFILE.description,
    jobTitle: "Technology Consultant",
    worksFor: { "@type": "Organization", name: "Deloitte" },
    alumniOf: { "@type": "CollegeOrUniversity", name: EXPERIENCE[EXPERIENCE.length - 1].org },
    address: { "@type": "PostalAddress", addressLocality: "Bengaluru", addressCountry: "IN" },
    knowsAbout: SKILLS.map((s) => s.name),
    sameAs: [PROFILE.github, PROFILE.linkedin],
    owns: PROJECTS.map((p) => ({
      "@type": "SoftwareApplication",
      name: p.title,
      url: new URL(p.href, PROFILE.url).toString(),
      description: p.description,
    })),
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${interTight.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <SiteHeader />
          {children}
          <BackToTop />
        </ThemeProvider>
        {/* Page Destroyer's install link (shared with /page-destroyer/). */}
        <Script src="/page-destroyer/store.js" type="module" strategy="lazyOnload" />
      </body>
    </html>
  );
}
