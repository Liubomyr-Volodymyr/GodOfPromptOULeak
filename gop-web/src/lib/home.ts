import { SITE_ORIGIN } from "@/lib/seo/site";
/**
 * Homepage content — single source of truth for the marketing copy + data
 * the home sections render. Real, verifiable values live here; anything
 * still needing Robert's input is marked `// TODO(content)` so it's easy to
 * find and swap. Honesty rule: NO fabricated numbers (no "30,000+"), no
 * invented prices, no fake testimonials shipped as schema.
 */

export const SITE = {
  name: "God of Prompt",
  url: SITE_ORIGIN,
  tagline: "The AI prompt library that thinks like a pro.",
  founder: "Robert Youssef",
  founderX: "https://x.com/godofprompt",
  // Founder's personal socials (the founder card links to these, distinct
  // from the brand socials used in the footer / Organization schema).
  founderPersonalX: "https://x.com/rryssf_",
  founderLinkedIn: "https://www.linkedin.com/in/robert-youssef/",
  // "Join the community" primary CTA target. TODO(content): swap to a
  // dedicated community link (Skool/Discord) if one exists; the brand X is
  // the real public community hub until then.
  community: "https://x.com/godofprompt",
  socials: [
    "https://x.com/godofprompt",
    "https://www.linkedin.com/company/god-of-prompt/",
    "https://www.youtube.com/@god-of-prompt",
    "https://www.instagram.com/godofprompt/",
  ],
};

/** Hero copy (mirrors the old-repo hero: brand H1 + mascot). */
export const HERO = {
  // Rendered as one <h1>; `pill` is the gold-highlighted phrase.
  titleLead: "Your",
  titlePill: "AI Superpowers",
  titleTail: "In One Click",
  sub: "The most powerful AI prompts for every major model — fully customizable, engineered to run, and refined by a community that ships. Start from a result, not a blank box.",
  primary: { label: "Get Lifetime Access", href: "/complete-ai-bundle" },
  secondary: { label: "Explore Prompts", href: "/prompt-library" },
  // Social-proof line under the CTAs. Honest + no fabricated rating/count —
  // avatar stack + a qualitative claim (see Hero.tsx).
  socialProof: "Loved by founders, marketers & creators",
};

/** Trust-bar stats. Honest figures from the live API (5,054 prompts, 36
 *  products) — NO "30,000+". */
export const STATS: Array<{ value: string; label: string }> = [
  { value: "5,000+", label: "Engineered prompts" }, // live catalogue ≈ 5,054
  { value: "36", label: "Products & toolkits" }, // /api/library/products
  { value: "19", label: "Categories" },
  { value: "Daily", label: "New prompts added" },
];

/** About / mission block. */
export const ABOUT = {
  eyebrow: "Why it exists",
  title: "The shortcut between you and a result",
  body: [
    "Most people meet AI with a blank box and lose an hour guessing at the right wording. God of Prompt removes that step: a curated library of prompts that already work, organized so you can find the one you need and run it.",
    "Every prompt is engineered with role, context, task, constraints, and output format, tested in real work, and kept current as the models change. You start from a proven result instead of a blank page.",
  ],
};


/** The Complete AI Bundle — the money section + Product schema source.
 *  TODO(content): confirm real price/currency/url before the Product JSON-LD
 *  is emitted. While `price` is null the schema is intentionally NOT shipped
 *  (no fake price ever). */
export const BUNDLE = {
  name: "The Complete AI Bundle",
  href: "/complete-ai-bundle",
  description:
    "Every engineered prompt, tool, and template in one lifetime bundle, organized for marketers, founders, and agencies who'd rather ship than fiddle.",
  // TODO(content): confirm the real price/currency before the Product JSON-LD
  // ships (it stays off while price is null — no fabricated price).
  price: null as number | null, // e.g. 150
  priceCurrency: "USD",
  compareAt: null as number | null, // e.g. 600 (original/was price)
  // Real contents (from the live bundle): the assets a buyer unlocks.
  includes: [
    "The full engineered prompt library for ChatGPT, Claude, Gemini, Grok, Midjourney, and Nano Banana",
    "The Custom GPTs Toolkit",
    "The No-Code Automations Bundle",
    "The 200+ AI Tools Directory",
    "The AI Cheatsheets Collection and ChatGPT Custom Instructions",
    "Every prompt pack we ship from now on, with lifetime updates",
  ],
};


/** FAQ — plain HTML <details>, NO FAQPage schema. Long-tail + AI-citation. */
export const FAQS: Array<{ q: string; a: string }> = [
  {
    q: "What is God of Prompt?",
    a: "God of Prompt is a curated library of AI prompts, guides, and playbooks for ChatGPT, Claude, Gemini, Grok, and Midjourney. 5,000+ engineered prompts across 19 categories, used by founders, marketers, and creators to ship marketing, sales, content, and code with AI. It's not another prompt dump; it's the operating system teams use to get pro-grade output on the first try.",
  },
  {
    q: "Why are free AI prompt lists usually a waste of time?",
    a: "Most free prompts online are generic, untested, and produce output that screams \"AI wrote this.\" They get copied between dozens of lists by people who never ran a business with them. God of Prompt's prompts are engineered: every one specifies role, context, task, constraints, and output format, the structure that consistently wins on GPT-5.6, Claude Fable 5, and Gemini 3.5 Pro. Output you can ship, not output you have to rewrite.",
  },
  {
    q: "What makes God of Prompt's prompts different?",
    a: "Depth and proof. Every prompt encodes role, context, task, constraints, and a strict output format, the same pattern OpenAI and Anthropic recommend in their own docs. And every prompt is tested in real businesses, including ours: God of Prompt is built and operated using these exact prompts. You're not buying theory; you're buying the playbook a working AI business runs on.",
  },
  {
    q: "What's inside the Complete AI Bundle?",
    a: "The Complete AI Bundle is the one-time purchase that unlocks every premium asset with lifetime updates: the full prompt library for ChatGPT, Claude, Gemini, Grok, Midjourney, and Nano Banana; the Custom GPTs Toolkit; the No-Code Automations Bundle; the 200+ AI Tools Directory; the AI Cheatsheets Collection; ChatGPT Custom Instructions; and every prompt pack we ship from now on.",
  },
  {
    q: "How fast will I see results?",
    a: "There's no learning curve. You copy a prompt, replace the bracketed placeholders with your context, paste into ChatGPT or Claude, and ship. The prompts are designed to work the first time, not after a 12-step course, so most people get usable output within minutes of opening the library.",
  },
  {
    q: "Are the prompts updated for the latest models?",
    a: "Yes. The library is maintained for the current lineup: GPT-5.6 (the new ChatGPT default), Claude Fable 5 and Opus 4.8, Gemini 3.5 Pro, Grok 4.5, DeepSeek, Midjourney, and Nano Banana. Free lists go stale the moment a new model ships; this one keeps pace, and your lifetime access includes every update.",
  },
];
