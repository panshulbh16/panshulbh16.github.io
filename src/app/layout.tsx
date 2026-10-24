import Navbar from "@/components/navbar";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DATA } from "@/data/resume";
import { cn } from "@/lib/utils";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { FlickeringGrid } from "@/components/magicui/flickering-grid";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

const title = `${DATA.name} · Technology consultant and product engineer`;
const ogImage = { url: "/og.png", width: 1200, height: 630, alt: `${DATA.name}, ${DATA.location}` };

export const metadata: Metadata = {
  metadataBase: new URL(DATA.url),
  title,
  description: DATA.description,
  authors: [{ name: DATA.name, url: DATA.url }],
  alternates: { canonical: "/" },
  icons: { icon: "/assets/favicon.svg" },
  openGraph: {
    title,
    description: DATA.description,
    url: "/",
    siteName: DATA.name,
    locale: "en_IN",
    type: "profile",
    images: [ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: DATA.description,
    images: [ogImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  url: `${DATA.url}/`,
  mainEntity: {
    "@type": "Person",
    name: DATA.name,
    url: `${DATA.url}/`,
    email: `mailto:${DATA.contact.email}`,
    description: DATA.description,
    jobTitle: "Technology Consultant",
    worksFor: { "@type": "Organization", name: "Deloitte" },
    alumniOf: { "@type": "CollegeOrUniversity", name: DATA.education[0].school },
    address: { "@type": "PostalAddress", addressLocality: "Bengaluru", addressCountry: "IN" },
    knowsAbout: DATA.skills.map((s) => s.name),
    sameAs: [DATA.contact.social.GitHub.url, DATA.contact.social.LinkedIn.url],
    owns: DATA.projects.map((p) => ({
      "@type": "SoftwareApplication",
      name: p.title,
      url: new URL(p.href, DATA.url).toString(),
      description: p.description,
    })),
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased relative",
          geist.variable,
          geistMono.variable
        )}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <TooltipProvider delayDuration={0}>
            <div className="absolute inset-0 top-0 left-0 right-0 h-[100px] overflow-hidden z-0">
              <FlickeringGrid
                className="h-full w-full"
                squareSize={2}
                gridGap={2}
                style={{
                  maskImage: "linear-gradient(to bottom, black, transparent)",
                  WebkitMaskImage: "linear-gradient(to bottom, black, transparent)",
                }}
              />
            </div>
            <div className="relative z-10 max-w-2xl mx-auto py-12 pb-24 sm:py-24 px-6">
              {children}
            </div>
            <Navbar />
          </TooltipProvider>
        </ThemeProvider>
        {/* Page Destroyer's install link (shared with /page-destroyer/). */}
        <Script src="/page-destroyer/store.js" type="module" strategy="lazyOnload" />
      </body>
    </html>
  );
}
