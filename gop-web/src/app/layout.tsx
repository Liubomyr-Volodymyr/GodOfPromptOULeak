import type { Metadata } from "next";
import { Roboto, Roboto_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import DotsBackground from "@/components/layout/DotsBackground";
import CommandPalette from "@/components/search/CommandPalette";
import { INDEXABLE, NOINDEX, OG_IMAGE } from "@/lib/seo/robots";
import { SITE_ORIGIN } from "@/lib/seo/site";
import AnimatedFavicon from "@/components/layout/AnimatedFavicon";

/**
 * GOP brand typography — per Figma 516-341 design-system spec.
 *
 *   sans  Roboto        400 / 500 / 600 / 700 — UI, body, headings
 *   mono  Roboto Mono   400 — prompt panel + code blocks
 *
 * Loaded via next/font for self-hosting + automatic subsetting + zero
 * CLS. CSS variables `--font-roboto` + `--font-roboto-mono` are wired
 * into Tailwind's `font-sans` / `font-mono` via globals.css @theme.
 */
const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "900"],
  // Italic needed for the hero display headline (heavy Black-Italic line).
  style: ["normal", "italic"],
  display: "swap",
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "God of Prompt — Master AI prompts for ChatGPT, Claude, Gemini and more",
    template: "%s — God of Prompt",
  },
  description: "Battle-tested AI prompts for marketers, founders, and creators. Browse 1000+ prompts across every major model.",
  // Canonical production origin by default — every host this build serves
  // (dev deploy, previews) resolves relative OG/canonical URLs against the
  // real site, matching each page's self-canonical. Env only overrides for
  // local experiments.
  metadataBase: new URL(SITE_ORIGIN),
  // Site-wide indexability default. On any build that is not the production
  // one (dev deploy, Railway previews, local) this is a hard `noindex,
  // nofollow` that EVERY route inherits — so the whole staging site is
  // de-indexed in the HTML, matching the X-Robots-Tag header from proxy.ts.
  // On production it is undefined, i.e. the crawler default (index, follow).
  ...(INDEXABLE ? {} : { robots: NOINDEX }),
  openGraph: {
    images: [OG_IMAGE],
    type: "website",
    siteName: "God of Prompt",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    site: "@godofprompt",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${roboto.variable} ${robotoMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-transparent">
        <AnimatedFavicon />
        <DotsBackground />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <CommandPalette />
      </body>
    </html>
  );
}
