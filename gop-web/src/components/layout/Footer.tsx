import Link from "@/components/ui/Link";
import Image from "next/image";
import Icon, { type IconName } from "@/components/icon";


/**
 * Footer — token-driven, grey non-transparent slab. Ported 1:1 from
 * gop-web-temp/components/layout/Footer.jsx + Footer.module.css. The
 * background is `bg-gop-page` (#f5f5f5) — same colour the global
 * DotsBackground canvas paints, so the footer reads as a clean visual
 * terminus (the dots stop appearing because the footer is opaque on
 * top of the canvas).
 *
 *   ┌────────────────────────────────────────────────┐
 *   │  [faded "God of Prompt" wordmark]              │
 *   │                                                │
 *   │  ◐ logo                                        │
 *   │  About God of Prompt                           │
 *   │  Description text                              │
 *   │  socials                                       │
 *   │  ──────────────────────────────────────────    │
 *   │  © 2026 ...               Terms · Privacy ·    │
 *   └────────────────────────────────────────────────┘
 */

// LinkedIn + YouTube live on the dashed handle (`god-of-prompt`); the
// un-dashed `godofprompt` URLs 404 on both platforms — caught after a
// customer flagged the broken links from the gop-web-temp footer. X +
// Instagram still resolve on the un-dashed slug.
const SOCIALS: Array<{ name: string; icon: IconName; href: string }> = [
  { name: "X", icon: "x", href: "https://x.com/godofprompt" },
  {
    name: "LinkedIn",
    icon: "linkedin",
    href: "https://www.linkedin.com/company/god-of-prompt/",
  },
  {
    name: "YouTube",
    icon: "youtube",
    href: "https://www.youtube.com/@god-of-prompt",
  },
  {
    name: "Instagram",
    icon: "instagram",
    href: "https://www.instagram.com/godofprompt/",
  },
];

// Footer nav columns (Figma 2033:22747). Relative paths follow the same
// convention as the navbar + the existing legal links — they resolve on the
// production domain (some aren't built inside this repo yet). AI Tools IS
// built here (/tools). Guides + Blog stay linked from the navbar.
const PLATFORM_LINKS = [
  { label: "Prompt Library", href: "/prompt-library" },
  { label: "AI Tools", href: "/tools" },
  { label: "Products", href: "/products" },
  { label: "Pricing", href: "/pricing" },
  { label: "Affiliates", href: "/affiliates" },
];

const TEAM_LINKS = [
  { label: "Support", href: "/support" },
  { label: "Partnerships", href: "mailto:Partner@godofprompt.ai" },
];

export default function Footer() {
  return (
    <footer className="relative flex w-full flex-col text-gop-ink font-sans">
      {/* Wordmark band — TRANSPARENT so the dot canvas shows through; the
       * canvas carves the dots out of the SVG's letter contours
       * (data-dots-mask), so dots flow around the letters instead of
       * bleeding through them. */}
      <div
        aria-hidden
        className="relative z-[1] mx-auto w-[90%] max-w-[1100px] overflow-hidden border-b border-gop-ink-edge pointer-events-none max-[900px]:w-full"
      >
        {/* Filled wordmark (the SVG's own fill) + a bottom gradient fade —
         * the "nice gradient". data-dots-mask makes the dot canvas carve
         * the exact letter contours. */}
        <Image
          src="/images/brand/bg-text.svg"
          alt=""
          width={1440}
          height={320}
          loading="lazy"
          decoding="async"
          data-dots-mask="/images/brand/bg-text.svg"
          className="block h-auto w-full -mb-8 opacity-90"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(245,245,245,0) 30%, rgba(245,245,245,0.7) 80%, rgba(245,245,245,1) 100%)",
          }}
        />
      </div>

      {/* Everything below the line is non-transparent. */}
      <div className="relative z-[2] mx-auto w-full bg-gop-page">
        <div className="mx-auto w-[90%] max-w-[1100px] max-[900px]:w-full max-[900px]:px-5">
          {/* Main block — left: logo + about + socials; right: link columns */}
          <div className="flex justify-between gap-12 py-8 pb-12 max-[900px]:flex-col max-[900px]:gap-10">
            <div className="text-left">
              <Image
                src="/images/brand/face.svg"
                alt="God of Prompt"
                width={56}
                height={56}
                loading="lazy"
                decoding="async"
                className="mb-4 block h-14 w-14"
              />
              <h3 className="m-0 mb-2 text-gop-body font-semibold text-gop-ink">
                About God of Prompt
              </h3>
              <p className="m-0 mb-5 max-w-[36ch] text-gop-body-sm text-gop-ink-muted max-[900px]:max-w-full">
                Cutting-edge AI products for streamlining
                <br />
                your workflow.
              </p>
              <div
                className="flex items-center gap-2"
                aria-label="Social media"
              >
                {SOCIALS.map(({ name, icon, href }) => (
                  <a
                    key={icon}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={name}
                    className={[
                      "inline-flex h-9 w-9 items-center justify-center rounded-full",
                      "text-gop-ink-muted bg-transparent",
                      "transition-[color,background,transform]",
                      "duration-200 ease-out hover:bg-gop-ink-hairline hover:text-gop-ink",
                      "active:translate-y-px",
                      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gop-ink",
                    ].join(" ")}
                  >
                    <Icon name={icon} size={18} title={name} />
                  </a>
                ))}
              </div>
            </div>

            {/* Link columns (Figma 2033:22747) */}
            <nav aria-label="Footer" className="flex gap-16 max-[640px]:gap-12">
              <FooterColumn title="Platform" links={PLATFORM_LINKS} />
              <FooterColumn title="Team" links={TEAM_LINKS} />
            </nav>
          </div>

          {/* Bottom row — copyright + legal links */}
          <div className="flex w-full items-center justify-between border-t border-gop-ink-edge py-5 pb-8 max-[900px]:flex-col max-[900px]:gap-3 max-[900px]:text-center">
            <p className="m-0 text-gop-body-sm text-gop-mute">
              © 2026 God of Prompt. All rights reserved.
            </p>
            <nav
              className="flex flex-wrap items-center gap-6"
              aria-label="Legal"
            >
              <a
                href="mailto:Partner@godofprompt.ai"
                className="text-gop-body-sm text-gop-mute no-underline transition-colors duration-150 ease-out hover:text-gop-ink"
              >
                Partnerships: Partner@godofprompt.ai
              </a>
              {[
                { label: "Terms of Service", href: "/terms" },
                { label: "Privacy Policy", href: "/privacy-policy" },
              ].map(({ label, href }) => (
                <Link
                  key={href}
                  href={href}
                  className="text-gop-body-sm text-gop-mute no-underline transition-colors duration-150 ease-out hover:text-gop-ink focus-visible:rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gop-ink"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}

/** One footer nav column — a heading over a list of links. */
function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: Array<{ label: string; href: string }>;
}) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="m-0 text-gop-body font-semibold text-gop-ink">{title}</h3>
      <ul className="m-0 flex flex-col gap-2.5 p-0 list-none">
        {links.map(({ label, href }) => (
          <li key={href}>
            <Link
              href={href}
              className="text-gop-body-sm text-gop-mute no-underline transition-colors duration-150 ease-out hover:text-gop-ink focus-visible:rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gop-ink"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
